package com.thamanicraft.security.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret:defaultSecretKeyWithAtLeast256BitsOfSecurityIfUsedInProd1234567890}")
    private String secret;

    @Value("${jwt.expiration:86400000}") // Default 1 day
    private Long expiration;

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    public String getEmailFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    public String getRoleFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("role", String.class));
    }

    public String getTenantIdFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("tenant_id", String.class));
    }

    public String getUserIdFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("user_id", String.class));
    }

    public String getUserNameFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("user_name", String.class));
    }

    @SuppressWarnings("unchecked")
    public List<String> getPermissionsFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("permissions", List.class));
    }

    public Boolean getHasPosFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("has_pos", Boolean.class));
    }

    public Integer getMaxInventoryItemsFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("max_inventory_items", Integer.class));
    }

    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    public Boolean isTokenExpired(String token) {
        final Date tokenExpirationDate = getExpirationDateFromToken(token);
        return tokenExpirationDate.before(new Date());
    }

    public Boolean validateToken(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}
