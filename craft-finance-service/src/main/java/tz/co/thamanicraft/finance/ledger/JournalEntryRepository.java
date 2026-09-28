package tz.co.thamanicraft.finance.ledger;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {
    List<JournalEntry> findByTenantIdOrderByEntryDateDesc(UUID tenantId);
}
