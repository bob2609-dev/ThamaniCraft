package com.thamanicraft.identity.controller;

import com.thamanicraft.identity.entity.PlatformAdmin;
import com.thamanicraft.identity.entity.PlatformRole;
import com.thamanicraft.identity.entity.PlatformPermission;
import com.thamanicraft.identity.repository.PlatformAdminRepository;
import com.thamanicraft.identity.repository.PlatformRoleRepository;
import com.thamanicraft.identity.repository.PlatformPermissionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.stream.Collectors;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/auth")
public class PlatformAdminController {

    private final PlatformAdminRepository adminRepo;
    private final PlatformRoleRepository roleRepo;
    private final PlatformPermissionRepository permissionRepo;
    private final PasswordEncoder passwordEncoder;

    public PlatformAdminController(PlatformAdminRepository adminRepo, PlatformRoleRepository roleRepo, PlatformPermissionRepository permissionRepo, PasswordEncoder passwordEncoder) {
        this.adminRepo = adminRepo;
        this.roleRepo = roleRepo;
        this.permissionRepo = permissionRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('MANAGE_PLATFORM_ADMINS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok(adminRepo.findAll().stream().map(a -> {
            return Map.of(
                "id", a.getId(),
                "name", a.getName(),
                "email", a.getEmail(),
                "isActive", a.isActive(),
                "roleName", a.getRole().getName()
            );
        }).toList());
    }

    @PostMapping("/users")
    @PreAuthorize("hasAuthority('MANAGE_PLATFORM_ADMINS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> payload) {
        PlatformAdmin admin = new PlatformAdmin();
        admin.setName((String) payload.get("name"));
        admin.setEmail((String) payload.get("email"));
        admin.setPassword(passwordEncoder.encode((String) payload.get("password")));
        admin.setActive(true);
        
        PlatformRole role = roleRepo.findById(Long.valueOf(payload.get("roleId").toString()))
                .orElseThrow(() -> new RuntimeException("Role not found"));
        admin.setRole(role);
        
        adminRepo.save(admin);
        return ResponseEntity.ok(Map.of("message", "User created successfully"));
    }

    @PutMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('MANAGE_PLATFORM_ADMINS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable UUID userId, @RequestBody Map<String, Object> payload) {
        PlatformAdmin admin = adminRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        admin.setName((String) payload.get("name"));
        admin.setEmail((String) payload.get("email"));
        
        if (payload.containsKey("password") && !((String) payload.get("password")).isEmpty()) {
            admin.setPassword(passwordEncoder.encode((String) payload.get("password")));
        }
        
        PlatformRole role = roleRepo.findById(Long.valueOf(payload.get("roleId").toString()))
                .orElseThrow(() -> new RuntimeException("Role not found"));
        admin.setRole(role);
        
        adminRepo.save(admin);
        return ResponseEntity.ok(Map.of("message", "User updated successfully"));
    }

    @PutMapping("/users/{userId}/toggle-status")
    @PreAuthorize("hasAuthority('MANAGE_PLATFORM_ADMINS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> toggleUserStatus(@PathVariable UUID userId) {
        PlatformAdmin admin = adminRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        admin.setActive(!admin.isActive());
        adminRepo.save(admin);
        return ResponseEntity.ok(Map.of("message", "User status updated"));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('MANAGE_PLATFORM_ADMINS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<PlatformRole>> getRoles() {
        return ResponseEntity.ok(roleRepo.findAll());
    }

    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('MANAGE_PLATFORM_ADMINS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createRole(@RequestBody Map<String, Object> payload) {
        PlatformRole role = new PlatformRole();
        role.setName((String) payload.get("name"));
        
        List<?> permissionIds = (List<?>) payload.get("permissionIds");
        Set<PlatformPermission> permissions = permissionIds.stream()
                .map(id -> permissionRepo.findById(Long.valueOf(id.toString())).orElseThrow(() -> new RuntimeException("Permission not found")))
                .collect(Collectors.toSet());
        
        role.setPermissions(permissions);
        roleRepo.save(role);
        return ResponseEntity.ok(Map.of("message", "Role created successfully"));
    }

    @PutMapping("/roles/{roleId}")
    @PreAuthorize("hasAuthority('MANAGE_PLATFORM_ADMINS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateRole(@PathVariable Long roleId, @RequestBody Map<String, Object> payload) {
        PlatformRole role = roleRepo.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        role.setName((String) payload.get("name"));
        
        List<?> permissionIds = (List<?>) payload.get("permissionIds");
        Set<PlatformPermission> permissions = permissionIds.stream()
                .map(id -> permissionRepo.findById(Long.valueOf(id.toString())).orElseThrow(() -> new RuntimeException("Permission not found")))
                .collect(Collectors.toSet());
        
        role.setPermissions(permissions);
        roleRepo.save(role);
        return ResponseEntity.ok(Map.of("message", "Role updated successfully"));
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('MANAGE_PLATFORM_ADMINS') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<PlatformPermission>> getPermissions() {
        return ResponseEntity.ok(permissionRepo.findAll());
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        PlatformAdmin admin = adminRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(payload.get("oldPassword"), admin.getPassword())) {
            throw new RuntimeException("Invalid old password");
        }
        
        admin.setPassword(passwordEncoder.encode(payload.get("newPassword")));
        adminRepo.save(admin);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
