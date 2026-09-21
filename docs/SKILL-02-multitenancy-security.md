# SKILL-02: Multi-Tenancy, Subdomains & Security

**Scope:** Identity Service, Spring Security, JWT Authentication, Multi-Tenant Isolation  

---

## 1. Subdomain Resolution & Dual-Name Model

To ensure URL routing stability while allowing business branding freedom:

1. **`name` (Subdomain Routing Slug)**:
   - System identifier used strictly for URL routing (`bakery1.thamanicraft.co.tz`) and database tenant resolution.
   - Lowercase, alphanumeric, and immutable.
2. **`display_name` (Business Display Name)**:
   - User-editable business name (e.g. `SUNRISE ARTISAN BAKERY & CAFE`).
   - Displayed across UI headers, receipts, invoices, and delivery notes.

---

## 2. Spring Boot Multi-Tenant Context Interceptor

```java
@Component
public class TenantInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String tenantHeader = request.getHeader("X-Tenant-ID");
        if (tenantHeader == null) {
            String host = request.getHeader("Host");
            if (host != null && host.contains(".")) {
                tenantHeader = host.split("\\.")[0];
            }
        }
        if (tenantHeader != null) {
            TenantContext.setCurrentTenant(tenantHeader);
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        TenantContext.clear();
    }
}
```

---

## 3. Hibernate Schema / Tenant Filter Enforcement

All JPA Entities in ThamaniCraft extend `TenantAwareEntity`:

```java
@MappedSuperclass
@Getter
@Setter
public abstract class TenantAwareEntity {
    @NotNull
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

---

## 4. Role-Based Access Control (RBAC)

ThamaniCraft defines standard manufacturing roles:

| Role | Permissions & Access Scope |
| :--- | :--- |
| **`TENANT_ADMIN`** | Full access to business settings, users, billing, recipes, finances, and dispatch. |
| **`PRODUCTION_MANAGER`**| Create and edit recipes, manage raw materials, schedule and execute batch work orders. |
| **`KITCHEN_OPERATOR`** | View scheduled batches, start/finish batches, log actual ingredient usage & waste. |
| **`PROCUREMENT_CLERK`** | Create and receive purchase orders (GRN), update raw ingredient stock & supplier costs. |
| **`SALES_DISPATCH`** | Create B2B orders, print delivery notes, issue invoices, record customer payments. |\n