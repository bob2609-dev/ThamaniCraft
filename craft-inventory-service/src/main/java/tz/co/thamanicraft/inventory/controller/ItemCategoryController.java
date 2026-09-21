package tz.co.thamanicraft.inventory.controller;

import com.thamanicraft.security.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tz.co.thamanicraft.inventory.entity.ItemCategory;
import tz.co.thamanicraft.inventory.service.ItemCategoryService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class ItemCategoryController {

    private final ItemCategoryService categoryService;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<List<ItemCategory>> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ResponseEntity.ok(categoryService.getAllByTenantId(tenantId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<ItemCategory> create(@RequestBody ItemCategory category) {
        category.setTenantId(TenantContext.getCurrentTenant());
        return ResponseEntity.ok(categoryService.createCategory(category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<ItemCategory> update(@PathVariable UUID id, @RequestBody ItemCategory category) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ResponseEntity.ok(categoryService.updateCategory(id, category, tenantId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        categoryService.deleteCategory(id, tenantId);
        return ResponseEntity.noContent().build();
    }
}
