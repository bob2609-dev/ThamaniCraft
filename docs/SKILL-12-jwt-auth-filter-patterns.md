# SKILL-12: JWT Authentication Filter & TenantContext Patterns

**Scope:** All Microservices (Identity, Catalog, POS, Finance, etc.)
**Lesson Source:** ThamaniPoint — bugs where `@PreAuthorize` silently failed and sales recorded "System" instead of the actual user.

---

## 1. The Complete JwtAuthFilter Contract

Every microservice MUST implement a `JwtAuthFilter` that extracts **all** relevant claims from the JWT and populates both `TenantContext` (ThreadLocal) and `SecurityContextHolder` (Spring Security).

### Required Claims to Extract

| JWT Claim | ThreadLocal Target | Spring Authority | Purpose |
| :--- | :--- | :--- | :--- |
| `tenant_id` | `TenantContext.setCurrentTenant()` | — | Multi-tenant data isolation |
| `user_id` | `TenantContext.setCurrentUserId()` | — | Audit trail / ownership tracking |
| `user_name` | `TenantContext.setCurrentUserName()` | — | Display name on transactions (receipts, logs) |
| `role` | — | `ROLE_<value>` | Role-based access (`hasRole()`) |
| `permissions` | — | Each as `SimpleGrantedAuthority` | Permission-based access (`hasAuthority()`) |
| `has_pos` | `TenantContext.setHasPos()` | — | Feature-flag for module access |
| `max_inventory_items` | `TenantContext.setMaxInventoryItems()` | — | Subscription limit enforcement |

### Reference Implementation

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

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

                // 2. Build Spring Security authorities: ROLE + permissions
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));

                List<String> permissions = jwtUtil.getPermissionsFromToken(token);
                if (permissions != null) {
                    for (String perm : permissions) {
                        authorities.add(new SimpleGrantedAuthority(perm));
                    }
                }

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
```

---

## 2. TenantContext Must Declare ALL ThreadLocals

**Bug encountered:** `TenantContext` referenced `CURRENT_USER_ID` and `CURRENT_USER_NAME` without declaring them as `ThreadLocal` fields, and `clear()` didn't clean them up.

### Correct Implementation

```java
public class TenantContext {
    private static final ThreadLocal<UUID>    CURRENT_TENANT    = new ThreadLocal<>();
    private static final ThreadLocal<UUID>    CURRENT_USER_ID   = new ThreadLocal<>();
    private static final ThreadLocal<String>  CURRENT_USER_NAME = new ThreadLocal<>();

    // Getters/setters for each...

    public static void clear() {
        CURRENT_TENANT.remove();
        CURRENT_USER_ID.remove();
        CURRENT_USER_NAME.remove();
        // ALL ThreadLocals must be cleaned here — memory leak otherwise
    }
}
```

### Rules
- Every `ThreadLocal` field MUST have a corresponding `.remove()` call in `clear()`.
- `clear()` MUST be called in the `finally` block of the filter.
- Never add a getter/setter pair without also declaring the backing `ThreadLocal` field.

---

## 3. @PreAuthorize Requires @EnableMethodSecurity

**Bug encountered:** `@PreAuthorize("hasAuthority('VIEW_LOGS')")` was annotated on a controller but silently did nothing because `@EnableMethodSecurity` was missing from `SecurityConfig`.

### Rules
- If ANY controller in a service uses `@PreAuthorize`, the `SecurityConfig` class MUST have `@EnableMethodSecurity`.
- If the JwtAuthFilter only adds `ROLE_<role>` (not individual permissions) as authorities, then `hasAuthority('VIEW_LOGS')` will ALWAYS fail. Permissions must be added as `SimpleGrantedAuthority` entries.
- **Test:** After adding `@PreAuthorize`, always verify the filter actually provides the required authority string.

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // <-- REQUIRED for @PreAuthorize to work
public class SecurityConfig { ... }
```

---

## 4. Token Re-Login Requirement After Permission Changes

When a user's role permissions are updated in the database (e.g., adding `VIEW_LOGS` to the Owner role), the change does NOT take effect until the user **logs out and logs back in** to get a fresh JWT.

### Why
Permissions are baked into the JWT at login time. The JWT is stateless — downstream services never query the database for permissions. Changing permissions in the DB only affects the next token generation.

### Design Decision
This is acceptable for an internal business tool. If real-time permission revocation is needed, implement token blacklisting or short-lived tokens with refresh.

---

## 5. Consistency Across Services

Every microservice (identity, catalog, pos, finance, analytics, crm) MUST have **identical** JwtAuthFilter behavior. If one service extracts `userId`/`userName` from the JWT and another doesn't, transactions in the second service will record `null` for the user.

### Checklist Before Deploying a New Service
- [ ] `JwtAuthFilter` extracts `tenant_id`, `user_id`, `user_name`, `role`, `permissions`
- [ ] `TenantContext` declares ThreadLocals for all extracted claims
- [ ] `TenantContext.clear()` removes all ThreadLocals
- [ ] `SecurityConfig` has `@EnableMethodSecurity` if any `@PreAuthorize` is used
- [ ] `JwtUtil` has getter methods for all expected JWT claims
- [ ] Service is rebuilt (`mvn clean package`) and container is recreated after code changes
