package tz.co.thamanicraft.inventory.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tz.co.thamanicraft.inventory.entity.ItemCategory;
import tz.co.thamanicraft.inventory.repository.ItemCategoryRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItemCategoryService {

    private final ItemCategoryRepository repository;

    public List<ItemCategory> getAllByTenantId(UUID tenantId) {
        return repository.findAllByTenantId(tenantId);
    }

    public ItemCategory createCategory(ItemCategory category) {
        return repository.save(category);
    }

    public ItemCategory updateCategory(UUID id, ItemCategory updatedCategory, UUID tenantId) {
        ItemCategory existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!existing.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Unauthorized");
        }

        existing.setName(updatedCategory.getName());
        existing.setDescription(updatedCategory.getDescription());
        return repository.save(existing);
    }

    public void deleteCategory(UUID id, UUID tenantId) {
        ItemCategory existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!existing.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Unauthorized");
        }

        repository.delete(existing);
    }
}
