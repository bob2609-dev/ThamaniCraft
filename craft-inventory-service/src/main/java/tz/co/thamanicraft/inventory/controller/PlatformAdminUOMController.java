package tz.co.thamanicraft.inventory.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tz.co.thamanicraft.inventory.entity.UnitOfMeasure;
import tz.co.thamanicraft.inventory.service.PlatformAdminUOMService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/uom")
@RequiredArgsConstructor
public class PlatformAdminUOMController {

    private final PlatformAdminUOMService service;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<UnitOfMeasure>> getAllGlobalUOMs() {
        return ResponseEntity.ok(service.getAllGlobalUOMs());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UnitOfMeasure> createGlobalUOM(@RequestBody UnitOfMeasure uom) {
        return ResponseEntity.ok(service.createGlobalUOM(uom));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UnitOfMeasure> updateGlobalUOM(@PathVariable UUID id, @RequestBody UnitOfMeasure uom) {
        return ResponseEntity.ok(service.updateGlobalUOM(id, uom));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteGlobalUOM(@PathVariable UUID id) {
        service.deleteGlobalUOM(id);
        return ResponseEntity.noContent().build();
    }
}
