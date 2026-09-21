package com.thamanicraft.security.filter;

import com.thamanicraft.security.context.TenantContext;
import com.thamanicraft.security.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.validateToken(token)) {
                String email     = jwtUtil.getEmailFromToken(token);
                String role      = jwtUtil.getRoleFromToken(token);
                String tenantId  = jwtUtil.getTenantIdFromToken(token);
                String userId    = jwtUtil.getUserIdFromToken(token);
                String userName  = jwtUtil.getUserNameFromToken(token);
                List<String> permissions = jwtUtil.getPermissionsFromToken(token);
                Boolean hasPos   = jwtUtil.getHasPosFromToken(token);
                Integer maxItems = jwtUtil.getMaxInventoryItemsFromToken(token);

                // 1. Populate TenantContext (ThreadLocal)
                if (tenantId != null && !tenantId.isBlank()) {
                    TenantContext.setCurrentTenant(UUID.fromString(tenantId));
                }
                if (userId != null && !userId.isBlank()) {
                    TenantContext.setCurrentUserId(UUID.fromString(userId));
                }
                if (userName != null) {
                    TenantContext.setCurrentUserName(userName);
                }
                if (hasPos != null) {
                    TenantContext.setHasPos(hasPos);
                }
                if (maxItems != null) {
                    TenantContext.setMaxInventoryItems(maxItems);
                }

                // 2. Build Spring Security authorities: ROLE + permissions
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                if (role != null) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                }

                if (permissions != null) {
                    for (String perm : permissions) {
                        authorities.add(new SimpleGrantedAuthority(perm));
                    }
                }

                System.out.println("Authorities: " + authorities);
                System.out.println("=======================");

                // 3. Set authentication context
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear(); // CRITICAL: always clean up ThreadLocals
        }
    }
}
