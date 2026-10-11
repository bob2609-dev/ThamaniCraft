package tz.co.thamanicraft.finance;

import com.thamanicraft.security.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;

import tz.co.thamanicraft.finance.ledger.Account;
import tz.co.thamanicraft.finance.ledger.JournalLine;
import tz.co.thamanicraft.finance.ledger.LedgerService;

@Service
public class FinanceService {
    private final FixedAssetRepository assetRepo;
    private final ExpenseRepository expenseRepo;
    private final FacilityLeaseRepository leaseRepo;
    private final LedgerService ledgerService;

    public FinanceService(FixedAssetRepository assetRepo, ExpenseRepository expenseRepo,
            FacilityLeaseRepository leaseRepo, LedgerService ledgerService) {
        this.assetRepo = assetRepo;
        this.expenseRepo = expenseRepo;
        this.leaseRepo = leaseRepo;
        this.ledgerService = ledgerService;
    }

    private UUID tenant() {
        UUID id = TenantContext.getCurrentTenant();
        if (id == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tenant context required");
        return id;
    }

    public List<FixedAsset> assets() {
        return assetRepo.findByTenantIdOrderByPurchaseDateDescCreatedAtDesc(tenant());
    }

    public List<Expense> expenses() {
        return expenseRepo.findByTenantIdOrderByExpenseDateDescCreatedAtDesc(tenant());
    }

    public List<FacilityLease> leases() {
        return leaseRepo.findByTenantIdOrderByCreatedAtDesc(tenant());
    }

    @Transactional
    public UUID saveAsset(UUID id, FinanceRequests.Asset a) {
        UUID tenant = tenant(), user = TenantContext.getCurrentUserId();
        FixedAsset entity;
        if (id == null) {
            entity = new FixedAsset();
            entity.setId(UUID.randomUUID());
            entity.setTenantId(tenant);
            entity.setCreatedBy(user);
        } else {
            entity = assetRepo.findByIdAndTenantId(id, tenant)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        }

        entity.setName(a.name().trim());
        entity.setCategory(a.category());
        entity.setPurchaseDate(a.purchaseDate());
        entity.setPurchaseCost(a.purchaseCost());
        entity.setStatus(a.status());
        entity.setReference(a.reference());
        entity.setNotes(a.notes());
        entity.setUpdatedBy(user);
        entity.setUpdatedAt(LocalDateTime.now());

        assetRepo.save(entity);
        return entity.getId();
    }

    @Transactional
    public UUID saveExpense(UUID id, FinanceRequests.Expense e) {
        UUID tenant = tenant(), user = TenantContext.getCurrentUserId();
        Expense entity;
        if (id == null) {
            entity = new Expense();
            entity.setId(UUID.randomUUID());
            entity.setTenantId(tenant);
            entity.setCreatedBy(user);
        } else {
            entity = expenseRepo.findByIdAndTenantId(id, tenant)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        }

        entity.setTitle(e.title().trim());
        entity.setCategory(e.category());
        entity.setExpenseDate(e.expenseDate());
        entity.setAmount(e.amount());
        entity.setReference(e.reference());
        entity.setNotes(e.notes());
        entity.setUpdatedBy(user);
        entity.setUpdatedAt(LocalDateTime.now());

        expenseRepo.save(entity);
        return entity.getId();
    }

    @Transactional
    public UUID quickExpense(FinanceRequests.Expense e) {
        UUID id = saveExpense(null, e);

        Account expenseAccount = new Account();
        expenseAccount.setCode("5100"); // Operating Expenses
        Account cashAccount = new Account();
        cashAccount.setCode("1000"); // Cash

        JournalLine debitLine = new JournalLine();
        debitLine.setAccount(expenseAccount);
        debitLine.setDebitAmount(e.amount());

        JournalLine creditLine = new JournalLine();
        creditLine.setAccount(cashAccount);
        creditLine.setCreditAmount(e.amount());

        List<JournalLine> lines = List.of(debitLine, creditLine);

        ledgerService.postJournalEntry(tenant(), "EXP-" + id.toString().substring(0, 8), "Quick Expense - " + e.title(),
                e.expenseDate().atStartOfDay(), lines);
        return id;
    }
}
