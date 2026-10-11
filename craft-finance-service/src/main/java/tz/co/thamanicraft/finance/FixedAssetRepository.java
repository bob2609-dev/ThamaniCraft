package tz.co.thamanicraft.finance;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FixedAssetRepository extends JpaRepository<FixedAsset, UUID> {
    List<FixedAsset> findByTenantIdOrderByPurchaseDateDescCreatedAtDesc(UUID tenantId);
    Optional<FixedAsset> findByIdAndTenantId(UUID id, UUID tenantId);
}
