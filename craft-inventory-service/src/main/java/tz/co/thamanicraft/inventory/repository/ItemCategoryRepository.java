package tz.co.thamanicraft.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.thamanicraft.inventory.entity.ItemCategory;

import java.util.List;
import java.util.UUID;

@Repository
public interface ItemCategoryRepository extends JpaRepository<ItemCategory, UUID> {
    List<ItemCategory> findAllByTenantId(UUID tenantId);
}
