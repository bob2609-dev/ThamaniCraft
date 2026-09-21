# SKILL-11: RBAC & Granular Permissions Architecture

This document captures the Role-Based Access Control (RBAC) architecture implemented in ThamaniPoint, ensuring that the ThamaniCraft project adopts the same granular security model.

## 1. Database Architecture
Permissions are granular and treated as first-class entities.
- **Roles Table**: Contains roles (e.g., Cashier, Supervisor). Distinguishes between `isSystemRole` (uneditable core roles) and custom roles.
- **Permissions Table**: Contains individual actions (e.g., `CREATE_PRODUCTS`, `VIEW_INVENTORY`, `PROCESS_SALES`).
- **Role_Permissions Table**: Many-to-Many mapping linking roles to their allowed permissions.

## 2. Authentication & JWT Structure
When a user logs in via the **Identity Service**, the system resolves their Role and fetches the mapped Permissions.
- **Token Generation**: The generated JWT includes a custom claim `permissions` containing the list of permission strings (e.g., `["VIEW_PRODUCTS", "CREATE_PRODUCTS"]`).
- This offloads database lookups on every request, making downstream services stateless and fast.

## 3. Microservice Security (Backend)
All downstream microservices (Catalog, POS, Finance, etc.) must implement stateless JWT verification.
- **JwtAuthFilter**: Extracts the `permissions` claim from the JWT and converts them into Spring Security `SimpleGrantedAuthority` objects.
- **Method-Level Security**: Services enable `@EnableMethodSecurity` allowing endpoints to be protected cleanly:
  ```java
  @PreAuthorize("hasAuthority('CREATE_PRODUCTS')")
  @PostMapping
  public ResponseEntity<?> createProduct(...) { ... }
  ```

## 4. Frontend Implementation (Tenant UI)
The frontend enforces RBAC visually and structurally to prevent unauthorized navigation.
- **Custom Hooks**: A `usePermissions` hook allows components to check `hasPermission('ACTION')`.
- **Route/Menu Guarding**: The main layout filters the sidebar navigation so users only see modules they have access to (e.g., hiding the "Reports" tab if `VIEW_REPORTS` is absent).
- **Component-Level Guarding**: Action buttons (Add, Edit, Delete) are hidden or disabled dynamically.
  ```javascript
  {hasPermission('CREATE_PRODUCTS') && <Button>Add Product</Button>}
  ```

## 5. UI/UX for Role Management
When designing the "Create/Edit Role" interface for tenant admins:
- Group permissions logically by domain (e.g., PRODUCTS, INVENTORY, SALES, PURCHASES) rather than a single flat list.
- Use a multi-column grid layout to prevent excessive vertical scrolling.
- Keep permission labels concise (e.g., `CREATE`, `VIEW`, `UPDATE` under a `PRODUCTS` heading).
- Include an easy "Edit Role" function that pre-populates existing assigned permissions using a `PUT` endpoint.

## 6. Audit Logging
To track system activities and maintain accountability:
- **Context Injection**: Each request must parse the JWT to extract `userId` and `userName`, storing them in a `ThreadLocal` context.
- **Event Emitting**: Microservices emit `AuditEvent` payloads to a centralized RabbitMQ queue for significant actions (e.g., processing sales, adjusting inventory).
- **Centralized Storage**: The `identity-service` consumes these events and stores them in an `audit_logs` table.
- **UI Access**: A dedicated `/logs` page guarded by the `VIEW_LOGS` permission allows admins to view the audit trail.
