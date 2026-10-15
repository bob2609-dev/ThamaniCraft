package com.thamanicraft.identity.service;

import com.thamanicraft.identity.dto.AuthRequest;
import com.thamanicraft.identity.dto.AuthResponse;
import com.thamanicraft.identity.entity.Permission;
import com.thamanicraft.identity.entity.User;
import com.thamanicraft.identity.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.thamanicraft.identity.repository.TenantRepository tenantRepository;
    private final com.thamanicraft.identity.repository.TenantSubscriptionRepository tenantSubRepository;
    
    @Value("${jwt.secret:defaultSecretKeyWithAtLeast256BitsOfSecurityIfUsedInProd1234567890}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private Long expiration;

    public AuthServiceImpl(
            UserRepository userRepository, 
            PasswordEncoder passwordEncoder, 
            com.thamanicraft.identity.repository.TenantRepository tenantRepository,
            com.thamanicraft.identity.repository.TenantSubscriptionRepository tenantSubRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tenantRepository = tenantRepository;
        this.tenantSubRepository = tenantSubRepository;
    }

    @Override
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid credentials"));

        com.thamanicraft.identity.entity.Tenant tenantObj = null;
        if (request.getTenant() != null && !request.getTenant().equals("localhost")) {
            tenantObj = tenantRepository.findByName(request.getTenant())
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid credentials"));
            if (!tenantObj.getId().equals(user.getTenantId())) {
                throw new org.springframework.security.authentication.BadCredentialsException("Invalid credentials");
            }
        } else if (user.getTenantId() != null) {
            tenantObj = tenantRepository.findById(user.getTenantId()).orElse(null);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new org.springframework.security.authentication.DisabledException("User account is disabled");
        }

        List<String> permissions = user.getRole().getPermissions().stream()
                .map(Permission::getName)
                .collect(Collectors.toList());

        Key key = Keys.hmacShaKeyFor(secret.getBytes());

        boolean tenantActive = tenantObj != null ? tenantObj.isActive() : true;

        List<String> modules = new java.util.ArrayList<>();
        String planCode = "FREE";
        int maxInventoryItems = 50;

        if (user.getTenantId() != null) {
            com.thamanicraft.identity.entity.TenantSubscription sub = 
                tenantSubRepository.findByTenantIdAndStatus(user.getTenantId(), "ACTIVE").orElse(null);
            
            if (sub != null && sub.getPlan() != null) {
                planCode = sub.getPlan().getCode();
            }

            if (tenantObj != null && tenantObj.getCustomModules() != null && !tenantObj.getCustomModules().isBlank()) {
                String raw = tenantObj.getCustomModules();
                String clean = raw.replaceAll("[\\[\\]\" ]", "");
                for (String m : clean.split(",")) {
                    if (!m.isBlank()) {
                        modules.add(m.trim().toLowerCase());
                    }
                }
            } else if (sub != null && sub.getPlan() != null) {
                String raw = sub.getPlan().getIncludedModules();
                if (raw != null) {
                    String clean = raw.replaceAll("[\\[\\]\" ]", "");
                    for (String m : clean.split(",")) {
                        if (!m.isBlank()) {
                            modules.add(m.trim().toLowerCase());
                        }
                    }
                }
            } else {
                // Default free tier modules if no active subscription found
                modules.add("inventory");
                modules.add("recipes");
            }
        } else {
            // Platform / super admin users have full module access
            modules.addAll(List.of("inventory", "recipes", "production", "sales", "finance", "reports", "procurement", "expenses", "customers"));
        }

        boolean hasPos = modules.contains("sales") || modules.contains("pos");

        String token = Jwts.builder()
                .setSubject(user.getEmail())
                .claim("user_id", user.getId().toString())
                .claim("user_name", user.getName())
                .claim("tenant_id", user.getTenantId() != null ? user.getTenantId().toString() : null)
                .claim("tenant_active", tenantActive)
                .claim("role", user.getRole().getName())
                .claim("permissions", permissions)
                .claim("plan_code", planCode)
                .claim("modules", modules)
                .claim("has_pos", hasPos)
                .claim("max_inventory_items", maxInventoryItems)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        return new AuthResponse(token);
    }
}
