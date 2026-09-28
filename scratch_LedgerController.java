package com.thamanipoint.finance.controller;

import com.thamanipoint.finance.config.TenantContext;
import com.thamanipoint.finance.entity.Account;
import com.thamanipoint.finance.entity.JournalEntry;
import com.thamanipoint.finance.repository.AccountRepository;
import com.thamanipoint.finance.repository.JournalEntryRepository;
import com.thamanipoint.finance.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/ledger")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;
    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;

    @GetMapping("/trial-balance")
    public ResponseEntity<List<Account>> getTrialBalance() {
        UUID tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            return ResponseEntity.status(401).build();
        }
        
        ledgerService.initializeTenantAccounts(tenantId);
        return ResponseEntity.ok(accountRepository.findByTenantId(tenantId));
    }

    @GetMapping("/journal")
    public ResponseEntity<List<JournalEntry>> getJournalEntries() {
        UUID tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            return ResponseEntity.status(401).build();
        }
        
        return ResponseEntity.ok(journalEntryRepository.findByTenantIdOrderByEntryDateDesc(tenantId));
    }

    @PostMapping("/journal")
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
