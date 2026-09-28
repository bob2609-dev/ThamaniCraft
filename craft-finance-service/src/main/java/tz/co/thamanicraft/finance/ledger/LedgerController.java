package tz.co.thamanicraft.finance.ledger;

import com.thamanicraft.security.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/ledger")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;
    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;

    @GetMapping("/trial-balance")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_FINANCE') or hasAuthority('VIEW_REPORTS')")
    public ResponseEntity<List<Account>> getTrialBalance() {
        UUID tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            return ResponseEntity.status(401).build();
        }
        
        ledgerService.initializeTenantAccounts(tenantId);
        return ResponseEntity.ok(accountRepository.findByTenantId(tenantId));
    }

    @GetMapping("/journal")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_FINANCE') or hasAuthority('VIEW_REPORTS')")
    public ResponseEntity<List<JournalEntry>> getJournalEntries() {
        UUID tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            return ResponseEntity.status(401).build();
        }
        
        return ResponseEntity.ok(journalEntryRepository.findByTenantIdOrderByEntryDateDesc(tenantId));
    }

    @PostMapping("/journal")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('MANAGE_FINANCE')")
    public ResponseEntity<JournalEntry> postManualEntry(@RequestBody JournalEntry entry) {
        UUID tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            return ResponseEntity.status(401).build();
        }
        
        ledgerService.initializeTenantAccounts(tenantId);
        
        JournalEntry saved = ledgerService.postJournalEntry(tenantId, entry.getReference(), entry.getDescription(), entry.getEntryDate(), entry.getLines());
        return ResponseEntity.ok(saved);
    }
}
