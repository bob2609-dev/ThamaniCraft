# Accounting, Reports, & Audit Logs Requirements — ThamaniCraft

**Target Platform:** ThamaniCraft (Multi-Tenant Manufacturing ERP & Kitchen Management SaaS)  
**Document Purpose:** Define the functional requirements, system behavior, and architecture for automated accounting, management reporting, and systemic audit logging.

---

## 1. Automated Manufacturing Cost Accounting

ThamaniCraft employs "Invisible Double-Entry Bookkeeping." The system translates day-to-day manufacturing operations (receiving goods, baking, selling) into strict financial ledger entries without requiring the users to be accountants.

### 1.1 General Ledger Mappings
- **1300 - Raw Materials Inventory (Asset):** Value of unbaked/unprocessed ingredients based on moving average cost (MAC) or FIFO.
- **1320 - Work in Progress (WIP) (Asset):** Value of batches currently in ovens, resting, or otherwise in active production.
- **1350 - Finished Goods Inventory (Asset):** Packaged/completed items ready for sale or dispatch.
- **5010 - Cost of Goods Sold (COGS) (Expense):** Direct material and attributed labor cost of products actually sold.
- **5020 - Production Scrap & Spoilage (Expense):** Value of ruined batches, expired raw items, or waste recorded during recipe prep.
- **4010 - Wholesale & Retail Revenue (Revenue):** Total gross sales from dispatches and counter sales.

### 1.2 Automated Trigger Journal Matrix
1. **Procurement (GRN Received):** Debit `Raw Materials` / Credit `Accounts Payable`
2. **Start Batch:** Debit `WIP` / Credit `Raw Materials`
3. **Complete Batch:** Debit `Finished Goods` / Credit `WIP`
4. **Log Spoilage/Scrap:** Debit `Production Spoilage` / Credit `Raw Materials` (or WIP if batch ruined)
5. **Dispatch/Sale:** Debit `Accounts Receivable` (or Cash) & `COGS` / Credit `Sales Revenue` & `Finished Goods`

### 1.3 Manual Journal Adjustments
- Authorized financial controllers can create manual journal entries (e.g., depreciation, month-end accruals).
- Manual entries must explicitly capture the `Date` (never defaulting silently to system timestamps) and require a human-readable reference number (e.g., `ADJ-202610-001`).

---

## 2. Management & Financial Reporting

Reports provide actionable insights into the manufacturing efficiency and overall financial health of the tenant's operation.

### 2.1 Manufacturing Reports
- **Batch Yield Efficiency Report:** Compares theoretical recipe yield vs. actual logged yield. Highlights variances per recipe and per production shift.
- **Scrap & Spoilage Analysis:** Summarizes wasted value categorized by reason (e.g., "Expired," "Overbaked," "Spilled").
- **Production Cost Breakdown:** Shows direct material vs. estimated labor/overhead costs per batch produced.

### 2.2 Inventory & Financial Reports
- **Inventory Valuation Report:** Real-time financial value of Raw Materials, WIP, and Finished Goods.
- **Cost of Goods Sold (COGS) Report:** Detailed breakdown of COGS per SKU across custom date ranges.
- **Profit & Loss (P&L) Statement:** Standard income statement aggregating Revenue, COGS, Spoilage, and operating expenses.

### 2.3 Report Export & Delivery
- All reports must support export to `.csv` and `.pdf` formats.
- Reports must execute asynchronously if data volume is high, notifying the user when the download is ready.

---

## 3. Audit Logging & User Tracking

System integrity relies on centralized, non-repudiable audit logs that track "Who did What, When, and to Which Entity" across all microservices (POS, Catalog, Finance, etc.).

### 3.1 Architecture & Event Flow
- **Event Bus:** Services emit `AuditEvent` messages via RabbitMQ (`thamani.*` topic exchange).
- **Central Consumer:** The `identity-service` listens to these events and persists them to a central `audit_logs` table.

### 3.2 Payload & Traceability Requirements
- **Tenant Context Isolation:** Every event must strictly include the `tenantId`.
- **Human-Readable Identity:** Logs must record the `userName` (e.g., "John Doe") alongside the `userId`, resolving the "System" user display issue. The JWT Auth Filter is strictly responsible for extracting these claims into the `TenantContext`.
- **Action Taxonomy:** Actions use a `VERB_NOUN` structure (e.g., `PROCESS_SALE`, `ADJUST_INVENTORY`, `START_BATCH`).
- **Entity Correlation:** Include `entityType` (e.g., "Sale", "BatchOrder") and `entityId` to enable filtering logs by a specific record.

### 3.3 Transactional User Tracking
- Every transactional entity (`Sale`, `Purchase`, `BatchOrder`) must natively store the `userId` and `userName` of the user who committed the transaction.
- Frontend views (e.g., Sales History, Batch Queues) must display the user's name (e.g., "Cashier: Alice") rather than relying on secondary lookups.

---

## 4. Implementation Lessons from ThamaniPoint

To ensure system stability, data integrity, and a premium user experience, the following lessons from previous implementations must be strictly adhered to:

### 4.1 Soft Deletion for Financial Integrity
- Master data entities (Products, Ingredients, Recipes, Customers) **MUST** implement an `isActive` boolean flag (default `true`). 
- **Why**: Hard deleting a raw material or recipe breaks historical Batch Work Orders, Financial PnLs, and Invoices that reference that entity's ID.

### 4.2 Event-Driven Rollbacks & Compensating Transactions
- When a transactional document (e.g., Purchase Order, Batch Order, Sales Invoice) is deleted or voided, the system **MUST** emit a domain event (e.g., `batch.deleted`) to a RabbitMQ Topic Exchange.
- **Why**: Monolithic synchronous rollbacks lead to tight coupling. Deleting a Batch Order must independently notify the Inventory Service to increment raw materials, decrement finished goods, and notify the Finance Service to reverse the associated journal entries.

### 4.3 Atomic Database Operations for Inventory Valuation
- Stock adjustments (increment/decrement) **MUST** be performed via atomic JPQL/SQL `@Modifying` queries rather than fetching the entity, adjusting the value in memory, and saving.
- **Why**: Prevents race conditions when multiple users process sales or batch orders concurrently, which would silently corrupt inventory valuation and COGS calculations.

### 4.4 Explicit Date Selection for Accounting
- Silent defaults for transaction dates can cause accounting discrepancies. For manual journal entries or historical data entry, require an explicit `Date` field on the form.
- **Why**: Ensuring the user manually confirms the posting date avoids entries being logged in the wrong financial period by accident.

### 4.5 Printable A4 Financial Reports
- All analytical and financial reports (PnL, Batch Costing, Dispatch Notes) **MUST** include dedicated `@media print` CSS rules that force the layout into a single, clean A4 page export.
- **Why**: Standard responsive CSS does not translate well to PDF/Print. Large margins and sidebars cause reports to spill over to multiple pages.

### 4.6 Clean Unique Identifiers for References
- Never expose massive, raw UUID strings to users in the UI for generated references (e.g., `PURCHASE-3c108f95-007a-4273-a96e-da4b34fbcfff`). 
- **Why**: UI aesthetics and usability suffer. Always use a fallback ID that truncates UUIDs to the first 8 characters (`.substring(0, 8).toUpperCase()`) to provide clean, readable references in ledgers and receipts.

---

## 5. Role-Based Access Control (RBAC) & Permission Granularity

To support multi-tenant security and precise employee delegation, the system employs a highly granular, stateless RBAC model.

### 5.1 First-Class Permissions Model
- **Granular Actions**: Permissions are treated as individual, fine-grained actions rather than broad groups (e.g., `CREATE_PRODUCTS`, `VIEW_INVENTORY`, `PROCESS_SALES`, `VIEW_FINANCIAL_REPORTS`).
- **Role Mapping**: A `Role` entity (e.g., "Cashier", "Head Baker") maps Many-to-Many with specific `Permission` strings.

### 5.2 Stateless JWT Enforcement (Backend)
- **Token Claims**: Upon login, the Identity Service injects the assigned permissions array directly into a custom `permissions` JWT claim.
- **Fast Authorization**: This offloads database lookups on every request. Downstream microservices parse the JWT and use Spring Security's `@PreAuthorize("hasAuthority('ACTION')")` to enforce access at the controller method level.

### 5.3 UI & Structural Enforcement (Frontend)
The frontend visually and structurally enforces RBAC to prevent unauthorized actions and navigation:
- **Centralized Hook**: A `usePermissions()` React hook parses the JWT token natively to determine access (`hasPermission('ACTION')`). The `OWNER` role always bypasses checks.
- **Sidebar Menu Filtering**: The main navigation dynamically filters out modules the user lacks access to (e.g., the Reports tab vanishes entirely if `VIEW_REPORTS` is missing).
- **Route-Level Guards**: Direct URL navigation to unauthorized routes is blocked, rendering a "Forbidden" view instead.
- **Component-Level Guarding**: Individual UI elements (like "Add", "Edit", or "Delete" buttons) are hidden or disabled based on specific permissions (e.g., `{hasPermission('CREATE_PRODUCTS') && <Button>Add Product</Button>}`).

### 5.4 Role Management Interface UX
- When designing the Tenant Admin "Create/Edit Role" screen, permissions **MUST** be grouped logically by domain (e.g., `PRODUCTS`, `INVENTORY`, `SALES`, `REPORTS`) in a multi-column responsive grid layout. Flat lists of permissions are prohibited due to poor usability.
