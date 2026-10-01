package tz.co.thamanicraft.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.thamanicraft.inventory.entity.UnitOfMeasure;

import java.util.List;
import java.util.UUID;

@Repository
public interface UnitOfMeasureRepository extends JpaRepository<UnitOfMeasure, UUID> {
    List<UnitOfMeasure> findByTenantIdOrTenantIdIsNull(UUID tenantId);
}
