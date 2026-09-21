# SKILL-13: Audit Logging & User Tracking Across Microservices

**Scope:** All Services → Identity Service (centralized log store)
**Lesson Source:** ThamaniPoint — sales showing "System" instead of user name, audit logs failing to load.

---

## 1. Architecture Overview

```
┌─────────────┐    AuditEvent    ┌──────────────┐    RabbitMQ    ┌───────────────────┐
│  POS Service │ ──────────────> │  Topic        │ ────────────> │  Identity Service │
│  Catalog Svc │    (via AMQP)   │  Exchange     │               │  (AuditListener)  │
│  Finance Svc │                 │  "thamani.*"  │               │  ↓                │
└─────────────┘                  └──────────────┘               │  audit_logs table │
                                                                 └───────────────────┘
```

Each microservice emits `AuditEvent` messages to RabbitMQ when significant actions occur. The identity-service consumes these events and persists them in a centralized `audit_logs` table.

---

## 2. AuditEvent Payload

```java
public class AuditEvent implements Serializable {
    private UUID tenantId;
    private UUID userId;
    private String userName;     // Human-readable name, NOT email
    private String action;       // e.g., "PROCESS_SALE", "CREATE_PRODUCT", "ADJUST_INVENTORY"
    private String entityType;   // e.g., "Sale", "Product", "InventoryItem"
    private String entityId;     // UUID of the affected entity
    private String details;      // Human-readable description
}
```

### Rules
- `userName` MUST be the human-readable display name (e.g., "John Doe"), NOT the email address.
- `action` should follow the `VERB_NOUN` convention matching permission names where possible.
- `entityId` should be the UUID of the primary affected entity.

---

## 3. Emitting Audit Events from Services

```java
// In any service method after a significant action:
AuditEvent audit = new AuditEvent(
    TenantContext.getCurrentTenant(),
    TenantContext.getCurrentUserId(),
    TenantContext.getCurrentUserName(),
    "PROCESS_SALE",
    "Sale",
    savedSale.getId().toString(),
    "Processed sale with receipt: " + savedSale.getReceiptNumber() + " for total: " + totalAmount
);
rabbitTemplate.convertAndSend(EXCHANGE_NAME, "audit.event.sale", audit);
```

### Critical Prerequisite
The `TenantContext` MUST already be populated with `userId` and `userName` by the `JwtAuthFilter` (see SKILL-12). If the filter doesn't extract these claims, audit events will log `null` or "System".

---

## 4. Consuming & Storing Audit Events

```java
@Component
@RequiredArgsConstructor
public class AuditEventListener {

    private final AuditLogRepository auditLogRepository;

    @RabbitListener(queues = "audit-log-queue")
    public void handleAuditEvent(AuditEvent event) {
        AuditLog log = new AuditLog();
        log.setTenantId(event.getTenantId());
        log.setUserId(event.getUserId());
        log.setUserName(event.getUserName());
        log.setAction(event.getAction());
        log.setEntityType(event.getEntityType());
        log.setEntityId(event.getEntityId());
        log.setDetails(event.getDetails());
        auditLogRepository.save(log);
    }
}
```

---

## 5. Exposing Audit Logs via API

```java
@RestController
@RequestMapping("/api/v1/tenant")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping("/logs")
    @PreAuthorize("hasAuthority('VIEW_LOGS')")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        UUID tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(
            auditLogRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
        );
    }
}
```

### Prerequisites (see SKILL-12)
1. `@EnableMethodSecurity` on `SecurityConfig`
2. JwtAuthFilter adds permissions as `SimpleGrantedAuthority` objects
3. `VIEW_LOGS` permission exists in the permissions table

---

## 6. User Tracking on Transactional Entities

Every transactional entity (Sale, Purchase, BatchOrder, Expense) MUST store the user who performed the action.

### Entity Fields
```java
@Entity
public class Sale {
    // ... other fields
    
    @Column(name = "user_id")
    private UUID userId;
    
    @Column(name = "user_name")
    private String userName;
}
```

### Service Layer
```java
@Transactional
public Sale processSale(SaleRequestDto request) {
    Sale sale = new Sale();
    sale.setTenantId(TenantContext.getCurrentTenant());
    sale.setUserId(TenantContext.getCurrentUserId());
    sale.setUserName(TenantContext.getCurrentUserName());
    // ... rest of sale logic
}
```

### Frontend Display
```javascript
// In the sales table columns:
{
    title: 'Cashier',
    key: 'cashier',
    render: (_, record) => <Text>{record.userName || 'System'}</Text>
}
```

---

## 7. Common Pitfalls & Debugging

| Symptom | Root Cause | Fix |
| :--- | :--- | :--- |
| All sales show "System" as cashier | JwtAuthFilter doesn't extract `user_name` from JWT | Add `userName` extraction to filter + populate TenantContext |
| Audit logs show `null` for user | TenantContext fields not declared or not populated | Verify ThreadLocal declarations and filter extraction |
| "Failed to load audit logs" | `@PreAuthorize` active but `@EnableMethodSecurity` missing OR permissions not in authorities | Add `@EnableMethodSecurity` + add permissions to SecurityContext |
| Permissions granted but still denied | User hasn't logged out/in to get fresh JWT | Logout and login to regenerate token with new permissions |
| Container has old code | Service rebuilt locally but Docker container not recreated | Run `docker-compose up -d --build <service>` |
