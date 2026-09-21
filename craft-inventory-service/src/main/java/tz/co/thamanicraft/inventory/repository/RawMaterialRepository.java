package tz.co.thamanicraft.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.thamanicraft.inventory.entity.RawMaterial;

import java.util.List;
import java.util.UUID;

@Repository
public interface RawMaterialRepository extends JpaRepository<RawMaterial, UUID> {
    List<RawMaterial> findByTenantId(UUID tenantId);
}
