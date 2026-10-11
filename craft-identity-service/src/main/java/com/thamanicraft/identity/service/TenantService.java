package com.thamanicraft.identity.service;

import com.thamanicraft.identity.entity.Permission;
import com.thamanicraft.identity.entity.Role;
import com.thamanicraft.identity.entity.Tenant;
import com.thamanicraft.identity.entity.User;
import com.thamanicraft.identity.repository.PermissionRepository;
import com.thamanicraft.identity.repository.RoleRepository;
import com.thamanicraft.identity.repository.TenantRepository;
import com.thamanicraft.identity.repository.UserRepository;
import com.thamanicraft.security.context.TenantContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public TenantService(TenantRepository tenantRepository, RoleRepository roleRepository,
                         PermissionRepository permissionRepository, UserRepository userRepository,
                         PasswordEncoder passwordEncoder) {
        this.tenantRepository = tenantRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Tenant createTenantWithAdmin(String name, String displayName, String adminEmail, String adminPassword, String adminName) {
        // 1. Create the tenant
        Tenant tenant = new Tenant();
        tenant.setName(name);
        tenant.setDisplayName(displayName);
        tenant.setActive(true);
        tenant = tenantRepository.save(tenant);

        // Keep a backup of current tenant ID to restore later (in case this is called from an API thread)
        UUID previousTenant = TenantContext.getCurrentTenant();
        
        try {
            // Set context to the new tenant so that TenantAwareEntity populates correctly
            TenantContext.setCurrentTenant(tenant.getId());

            // 2. Create the OWNER role for this tenant
            Role ownerRole = new Role();
            ownerRole.setName("OWNER");
            ownerRole.setSystemRole(true);
            
            // Get all system permissions and assign to OWNER
            List<Permission> allPermissions = permissionRepository.findAll();
            ownerRole.setPermissions(new HashSet<>(allPermissions));
            ownerRole = roleRepository.save(ownerRole);

            // 3. Create the default admin user
            User adminUser = new User();
            adminUser.setEmail(adminEmail);
            adminUser.setPassword(passwordEncoder.encode(adminPassword));
            adminUser.setName(adminName);
            adminUser.setActive(true);
            adminUser.setRole(ownerRole);
            userRepository.save(adminUser);

        } finally {
            // Restore previous tenant context
            TenantContext.setCurrentTenant(previousTenant);
        }

        return tenant;
    }

    public List<Map<String, Object>> getAllTenantsWithAdmin() {
        List<Tenant> tenants = tenantRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Tenant t : tenants) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("name", t.getName());
            map.put("displayName", t.getDisplayName());
            map.put("active", t.isActive());
            
            User admin = userRepository.findByTenantId(t.getId()).stream()
                    .filter(u -> u.getRole() != null && "OWNER".equals(u.getRole().getName()))
                    .findFirst()
                    .orElse(null);
                    
            if (admin != null) {
                map.put("adminName", admin.getName());
                map.put("adminEmail", admin.getEmail());
            }
            result.add(map);
        }
        return result;
    }

    public Map<String, Object> getTenantWithAdmin(UUID tenantId) {
        Tenant t = tenantRepository.findById(tenantId).orElseThrow(() -> new RuntimeException("Tenant not found"));
        Map<String, Object> map = new HashMap<>();
        map.put("id", t.getId());
        map.put("name", t.getName());
        map.put("displayName", t.getDisplayName());
        map.put("active", t.isActive());
        
        User admin = userRepository.findByTenantId(t.getId()).stream()
                .filter(u -> u.getRole() != null && "OWNER".equals(u.getRole().getName()))
                .findFirst()
                .orElse(null);
                
        if (admin != null) {
            map.put("adminName", admin.getName());
            map.put("adminEmail", admin.getEmail());
        }
        return map;
    }

    @Transactional
    public void updateTenantWithAdmin(UUID tenantId, String name, String displayName, String adminEmail, String adminPassword, String adminName) {
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow(() -> new RuntimeException("Tenant not found"));
        tenant.setName(name);
        tenant.setDisplayName(displayName);
        tenantRepository.save(tenant);

        User admin = userRepository.findByTenantId(tenantId).stream()
                .filter(u -> u.getRole() != null && "OWNER".equals(u.getRole().getName()))
                .findFirst()
                .orElse(null);
                
        if (admin != null) {
            if (adminName != null && !adminName.isEmpty()) admin.setName(adminName);
            if (adminEmail != null && !adminEmail.isEmpty()) admin.setEmail(adminEmail);
            if (adminPassword != null && !adminPassword.isEmpty()) {
                admin.setPassword(passwordEncoder.encode(adminPassword));
            }
            userRepository.save(admin);
        }
    }
}
