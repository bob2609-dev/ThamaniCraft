package tz.co.thamanicraft.inventory.controller;

import com.thamanicraft.security.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tz.co.thamanicraft.inventory.entity.UnitOfMeasure;
import tz.co.thamanicraft.inventory.service.UnitOfMeasureService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/uom")
@RequiredArgsConstructor
public class UnitOfMeasureController {

    private final UnitOfMeasureService uomService;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<List<UnitOfMeasure>> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ResponseEntity.ok(uomService.getAllByTenantId(tenantId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<UnitOfMeasure> create(@RequestBody UnitOfMeasure uom) {
        uom.setTenantId(TenantContext.getCurrentTenant());
        return ResponseEntity.ok(uomService.createUnitOfMeasure(uom));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<UnitOfMeasure> update(@PathVariable UUID id, @RequestBody UnitOfMeasure uom) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ResponseEntity.ok(uomService.updateUnitOfMeasure(id, uom, tenantId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        uomService.deleteUnitOfMeasure(id, tenantId);
        return ResponseEntity.noContent().build();
    }
}
