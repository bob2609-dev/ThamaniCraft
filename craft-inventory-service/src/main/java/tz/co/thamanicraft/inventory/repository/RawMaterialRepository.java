package tz.co.thamanicraft.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.thamanicraft.inventory.entity.RawMaterial;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RawMaterialRepository extends JpaRepository<RawMaterial, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select m from RawMaterial m where m.id = :id and m.tenantId = :tenantId")
    Optional<RawMaterial> findForUpdate(UUID id, UUID tenantId);
    List<RawMaterial> findByTenantId(UUID tenantId);
    Optional<RawMaterial> findByTenantIdAndSkuIgnoreCase(UUID tenantId, String sku);
}
