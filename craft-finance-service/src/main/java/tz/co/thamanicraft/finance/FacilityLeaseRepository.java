package tz.co.thamanicraft.finance;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FacilityLeaseRepository extends JpaRepository<FacilityLease, UUID> {
    List<FacilityLease> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    Optional<FacilityLease> findByIdAndTenantId(UUID id, UUID tenantId);
}
