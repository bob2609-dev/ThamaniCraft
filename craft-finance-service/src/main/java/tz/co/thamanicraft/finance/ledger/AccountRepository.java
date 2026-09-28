package tz.co.thamanicraft.finance.ledger;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findByTenantId(UUID tenantId);
    Optional<Account> findByTenantIdAndCode(UUID tenantId, String code);
}
