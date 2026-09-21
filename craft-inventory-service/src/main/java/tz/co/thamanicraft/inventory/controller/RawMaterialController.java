package tz.co.thamanicraft.inventory.controller;

import com.thamanicraft.security.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tz.co.thamanicraft.inventory.entity.RawMaterial;
import tz.co.thamanicraft.inventory.service.RawMaterialService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/raw-materials")
@RequiredArgsConstructor
public class RawMaterialController {

    private final RawMaterialService rawMaterialService;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<List<RawMaterial>> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ResponseEntity.ok(rawMaterialService.getAllByTenantId(tenantId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<RawMaterial> create(@RequestBody RawMaterial material) {
        material.setTenantId(TenantContext.getCurrentTenant());
        return ResponseEntity.ok(rawMaterialService.createRawMaterial(material));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<RawMaterial> update(@PathVariable UUID id, @RequestBody RawMaterial material) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ResponseEntity.ok(rawMaterialService.updateRawMaterial(id, material, tenantId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_INVENTORY') or hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        rawMaterialService.deleteRawMaterial(id, tenantId);
        return ResponseEntity.noContent().build();
    }
}
