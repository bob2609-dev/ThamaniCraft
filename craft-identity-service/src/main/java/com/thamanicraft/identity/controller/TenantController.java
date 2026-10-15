package com.thamanicraft.identity.controller;

import com.thamanicraft.identity.entity.Tenant;
import com.thamanicraft.identity.repository.TenantRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/tenants")
public class TenantController {

    private final TenantRepository tenantRepo;
    private final com.thamanicraft.identity.service.TenantService tenantService;

    public TenantController(TenantRepository tenantRepo, com.thamanicraft.identity.service.TenantService tenantService) {
        this.tenantRepo = tenantRepo;
        this.tenantService = tenantService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MANAGE_TENANTS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getTenants() {
        return ResponseEntity.ok(tenantService.getAllTenantsWithAdmin());
    }

    @GetMapping("/{tenantId}")
    @PreAuthorize("hasAuthority('MANAGE_TENANTS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getTenant(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(tenantService.getTenantWithAdmin(tenantId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_TENANTS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createTenant(@RequestBody Map<String, String> payload) {
        String adminEmail = payload.get("adminEmail");
        String adminPassword = payload.get("adminPassword");
        String adminName = payload.get("adminName");
        
        if (adminEmail == null || adminPassword == null || adminName == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Admin credentials (adminEmail, adminPassword, adminName) are required for new tenants"));
        }
        
        Tenant tenant = tenantService.createTenantWithAdmin(
                payload.get("name"),
                payload.get("displayName"),
                adminEmail,
                adminPassword,
                adminName
        );
        return ResponseEntity.ok(Map.of("message", "Tenant created successfully", "id", tenant.getId()));
    }

    @PutMapping("/{tenantId}")
    @PreAuthorize("hasAuthority('MANAGE_TENANTS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateTenant(@PathVariable UUID tenantId, @RequestBody Map<String, String> payload) {
        tenantService.updateTenantWithAdmin(
            tenantId,
            payload.get("name"),
            payload.get("displayName"),
            payload.get("adminEmail"),
            payload.get("adminPassword"),
            payload.get("adminName")
        );
        return ResponseEntity.ok(Map.of("message", "Tenant updated successfully"));
    }

    @PutMapping("/{tenantId}/toggle-status")
    @PreAuthorize("hasAuthority('MANAGE_TENANTS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> toggleTenantStatus(@PathVariable UUID tenantId) {
        Tenant tenant = tenantRepo.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        if ("admin".equalsIgnoreCase(tenant.getName()) || 
            UUID.fromString("00000000-0000-0000-0000-000000000000").equals(tenant.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Admin tenant cannot be suspended"));
        }
        tenant.setActive(!tenant.isActive());
        tenantRepo.save(tenant);
        return ResponseEntity.ok(Map.of("message", "Tenant status updated"));
    }

    @GetMapping("/{tenantId}/modules")
    @PreAuthorize("hasAuthority('MANAGE_TENANTS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getTenantModules(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(tenantService.getTenantModuleDetails(tenantId));
    }

    @PutMapping("/{tenantId}/modules")
    @PreAuthorize("hasAuthority('MANAGE_TENANTS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateTenantModules(@PathVariable UUID tenantId, @RequestBody Map<String, Object> payload) {
        Object customModulesObj = payload.get("customModules");
        List<String> modules = null;
        if (customModulesObj instanceof List<?>) {
            modules = ((List<?>) customModulesObj).stream().map(Object::toString).toList();
        }
        return ResponseEntity.ok(tenantService.updateTenantModules(tenantId, modules));
    }
}
