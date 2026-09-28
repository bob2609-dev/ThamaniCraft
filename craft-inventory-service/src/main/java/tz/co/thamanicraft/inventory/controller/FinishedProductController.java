package tz.co.thamanicraft.inventory.controller;

import com.thamanicraft.security.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tz.co.thamanicraft.inventory.entity.FinishedProduct;
import tz.co.thamanicraft.inventory.service.FinishedProductService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/finished-products")
@RequiredArgsConstructor
public class FinishedProductController {

    private final FinishedProductService finishedProductService;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<List<FinishedProduct>> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ResponseEntity.ok(finishedProductService.getAllByTenantId(tenantId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<FinishedProduct> create(@RequestBody FinishedProduct product) {
        product.setTenantId(TenantContext.getCurrentTenant());
        return ResponseEntity.ok(finishedProductService.createFinishedProduct(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<FinishedProduct> update(@PathVariable UUID id, @RequestBody FinishedProduct product) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ResponseEntity.ok(finishedProductService.updateFinishedProduct(id, product, tenantId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        finishedProductService.deleteFinishedProduct(id, tenantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasAuthority('PROCESS_SALES') or hasRole('OWNER')")
    public ResponseEntity<Void> dispatch(@PathVariable UUID id, @RequestBody FinishedProductService.DispatchRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        String userId = TenantContext.getCurrentUserId() != null ? TenantContext.getCurrentUserId().toString() : "SYSTEM";
        finishedProductService.dispatchFinishedProduct(id, request, tenantId, userId);
        return ResponseEntity.ok().build();
    }
}
