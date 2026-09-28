package tz.co.thamanicraft.finance.ledger;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LedgerService {

    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;

    @Transactional
    public void initializeTenantAccounts(UUID tenantId) {
        List<Account> existing = accountRepository.findByTenantId(tenantId);
        if (!existing.isEmpty()) {
            return;
        }

        createAccount(tenantId, "1000", "Cash", AccountType.ASSET, true);
        createAccount(tenantId, "1100", "Accounts Receivable", AccountType.ASSET, true);
        createAccount(tenantId, "1200", "Inventory", AccountType.ASSET, true);
        createAccount(tenantId, "2000", "Accounts Payable", AccountType.LIABILITY, true);
        createAccount(tenantId, "3000", "Owner's Equity", AccountType.EQUITY, true);
        createAccount(tenantId, "4000", "Sales Revenue", AccountType.REVENUE, true);
        createAccount(tenantId, "5000", "Cost of Goods Sold", AccountType.EXPENSE, true);
        createAccount(tenantId, "5100", "Operating Expenses", AccountType.EXPENSE, true);
        createAccount(tenantId, "5200", "Inventory Shrinkage", AccountType.EXPENSE, true);
    }

    private void createAccount(UUID tenantId, String code, String name, AccountType type, boolean isSystem) {
        Account acc = new Account();
        acc.setTenantId(tenantId);
        acc.setCode(code);
        acc.setName(name);
        acc.setType(type);
        acc.setSystem(isSystem);
        acc.setBalance(BigDecimal.ZERO);
        accountRepository.save(acc);
    }

    public Account getAccountByCode(UUID tenantId, String code) {
        return accountRepository.findByTenantIdAndCode(tenantId, code)
                .orElseThrow(() -> new RuntimeException("Account not found: " + code));
    }

    @Transactional
    public JournalEntry postJournalEntry(UUID tenantId, String reference, String description, LocalDateTime entryDate, List<JournalLine> lines) {
        BigDecimal totalDebits = lines.stream()
                .map(JournalLine::getDebitAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredits = lines.stream()
                .map(JournalLine::getCreditAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebits.compareTo(totalCredits) != 0) {
            throw new RuntimeException("Journal Entry is unbalanced. Debits: " + totalDebits + " Credits: " + totalCredits);
        }

        JournalEntry entry = new JournalEntry();
        entry.setTenantId(tenantId);
        entry.setEntryDate(entryDate != null ? entryDate : LocalDateTime.now());
        entry.setReference(reference);
        entry.setDescription(description);

        for (JournalLine line : lines) {
            line.setJournalEntry(entry);
            
            Account account = accountRepository.findById(line.getAccount().getId())
                    .orElseThrow(() -> new RuntimeException("Account not found: " + line.getAccount().getId()));
            
            if (!account.getTenantId().equals(tenantId)) {
                throw new RuntimeException("Account does not belong to current tenant");
            }
            
            line.setAccount(account);
            updateAccountBalance(account, line.getDebitAmount(), line.getCreditAmount());
            accountRepository.save(account);
        }

        entry.setLines(lines);
        return journalEntryRepository.save(entry);
    }

    private void updateAccountBalance(Account account, BigDecimal debit, BigDecimal credit) {
        if (debit == null) debit = BigDecimal.ZERO;
        if (credit == null) credit = BigDecimal.ZERO;

        BigDecimal netChange;
        switch (account.getType()) {
            case ASSET:
            case EXPENSE:
                netChange = debit.subtract(credit);
                break;
            case LIABILITY:
            case EQUITY:
            case REVENUE:
                netChange = credit.subtract(debit);
                break;
            default:
                netChange = BigDecimal.ZERO;
        }

        account.setBalance(account.getBalance().add(netChange));
    }
}
