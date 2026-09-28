package tz.co.thamanicraft.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.thamanicraft.inventory.entity.FinishedProduct;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FinishedProductRepository extends JpaRepository<FinishedProduct, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from FinishedProduct p where p.id = :id and p.tenantId = :tenantId")
    Optional<FinishedProduct> findForUpdate(UUID id, UUID tenantId);
    
    List<FinishedProduct> findByTenantId(UUID tenantId);
    Optional<FinishedProduct> findByTenantIdAndSkuIgnoreCase(UUID tenantId, String sku);
}
