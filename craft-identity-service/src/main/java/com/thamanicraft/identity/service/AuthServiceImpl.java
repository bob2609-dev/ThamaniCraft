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
    
    @Value("${jwt.secret:defaultSecretKeyWithAtLeast256BitsOfSecurityIfUsedInProd1234567890}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private Long expiration;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new RuntimeException("User account is disabled");
        }

        List<String> permissions = user.getRole().getPermissions().stream()
                .map(Permission::getName)
                .collect(Collectors.toList());

        Key key = Keys.hmacShaKeyFor(secret.getBytes());

        String token = Jwts.builder()
                .setSubject(user.getEmail())
                .claim("user_id", user.getId().toString())
                .claim("user_name", user.getName())
                .claim("tenant_id", user.getTenantId() != null ? user.getTenantId().toString() : null)
                .claim("role", user.getRole().getName())
                .claim("permissions", permissions)
                // Defaulting subscription claims for now
                .claim("has_pos", true)
                .claim("max_inventory_items", 1000)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        return new AuthResponse(token);
    }
}
