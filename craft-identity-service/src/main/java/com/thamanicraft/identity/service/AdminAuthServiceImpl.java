package com.thamanicraft.identity.service;

import com.thamanicraft.identity.dto.AuthRequest;
import com.thamanicraft.identity.dto.AuthResponse;
import com.thamanicraft.identity.entity.PlatformPermission;
import com.thamanicraft.identity.entity.PlatformAdmin;
import com.thamanicraft.identity.repository.PlatformAdminRepository;
import com.thamanicraft.identity.service.AdminAuthService;
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
public class AdminAuthServiceImpl implements AdminAuthService {

    private final PlatformAdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${jwt.secret:defaultSecretKeyWithAtLeast256BitsOfSecurityIfUsedInProd1234567890}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private Long expiration;

    public AdminAuthServiceImpl(PlatformAdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public AuthResponse login(AuthRequest request) {
        PlatformAdmin admin = adminRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid admin credentials"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid admin credentials");
        }

        if (!admin.isActive()) {
            throw new org.springframework.security.authentication.DisabledException("Admin account is disabled");
        }

        List<String> permissions = admin.getRole().getPermissions().stream()
                .map(PlatformPermission::getName)
                .collect(Collectors.toList());

        Key key = Keys.hmacShaKeyFor(secret.getBytes());

        String token = Jwts.builder()
                .setSubject(admin.getEmail())
                .claim("user_id", admin.getId().toString())
                .claim("user_name", admin.getName())
                // Use the special system tenant ID to indicate this is a platform admin request
                .claim("tenant_id", "00000000-0000-0000-0000-000000000000")
                .claim("role", admin.getRole().getName())
                .claim("permissions", permissions)
                .claim("is_platform_admin", true)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        return new AuthResponse(token);
    }
}
