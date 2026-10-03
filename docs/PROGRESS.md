
# ThamaniCraft Implementation Progress

Last updated: 2026-09-24. Checked items indicate implemented functionality; verification gaps are listed separately below.

Start with [HANDOVER.md](HANDOVER.md) for current capabilities, known issues and next steps. Update HANDOVER, this file and the affected feature plan with every project change, distinguishing source implementation, deployment and verified behaviour.

- [X] 2026-10-02: Implemented automatic inventory deduction for POS "Made-to-Order" sales. Created `SalesEventListener` in `craft-production-service` to listen for `OrderFulfillment` events of type `JUST_IN_TIME`. When triggered, it creates a silent Work Order that instantly snapshots and marks it as `COMPLETION_PENDING` while publishing a `BatchCompleted` event with a null finished product ID. This safely triggers `InventoryPostingService` to deduct raw materials without erroneously crediting finished goods inventory.
- [X] 2026-10-01: Updated the `craft-production-service` to include pricing/costing details in the recipe list endpoint, and added columns for `Est. Batch Cost`, `Est. Unit Cost`, `Suggested Price (TZS)`, and `Auto-Calculated Margin` directly to the `Recipes.jsx` table UI.
- [X] 2026-09-30: Replaced the sandbox "Target margin" in the Recipe Editor with a real, persisted database field (`target_margin`). Added a V9 migration to `craft-production-service` to store it, and updated the frontend `RecipeEditor.jsx` to feature a bi-directional calculator: typing a margin percentage instantly computes the suggested selling price, and typing a flat selling price reverse-calculates the margin percentage. In `OrderEntry.jsx`, selecting a base recipe for a custom item now automatically sets the order line's `unitPrice` to this exact suggested price instead of the raw batch cost. Rebuilt and restarted both production and sales services, as well as the UI.
- [X] 2026-09-30: Resolved work order status synchronization and recipe mapping issues for custom items. Implemented a `BatchCompleted` RabbitMQ event listener in `craft-sales-service` to update `work_order_status` to `COMPLETED` when the production batch finishes. Configured `RABBITMQ_HOST` in `docker-compose.yml` for the sales service. Fixed a silent failure in `SalesService.java` where a slow response from the production service during recipe fetch would silently drop the custom item's recipe mapping, resulting in uncosted items. By removing the try-catch block, the transaction now properly fails (allowing retry) rather than saving broken data. Rebuilt and restarted `thamanicraft-sales-service`.
- [X] 2026-09-30: Fixed the UI incorrectly displaying "DRAFT" for work orders in the Order Costing Summary by successfully rebuilding the `craft-sales-service` backend, allowing the newly added `COALESCE` query to return the correct "COMPLETED" status. Corrected the profit margin calculation logic in `OrderCostingSummary.jsx` to explicitly check for `null` API values instead of evaluating `0` as falsey. This prevents uncosted custom items from artificially inflating the gross profit margin. Rebuilt and successfully brought up the UI and Sales containers.
- [X] 2026-09-29: Resolved the inventory 500 error caused by a Flyway migration caching conflict (V3 vs V9 duplication) by rebuilding `craft-inventory-service` without Docker cache.
- [X] 2026-09-29: Improved `Dashboard.jsx` to accurately split and display `Revenue` and `Gross Profit` as two distinct chart lines. Confirmed profit calculates correctly now that `unit_cost` is piped through from the backend.
- [X] 2026-09-29: Cleaned up backend deprecation warnings by removing the obsolete `hibernate.dialect` setting from all microservice `application.yml` configurations. Rebuilt and successfully started UI, Inventory, and Production containers.
- [X] 2026-09-28: Implemented decoupled Selling Price for Finished Products. Added `selling_price` to `finished_products` (inventory service) and `unit_cost` to `order_items` (sales service). Updated UI in `Inventory.jsx` and `OrderEntry.jsx` to configure and use this price. Updated backend queries to include direct sales of finished products in the order margin calculations.
- [X] 2026-09-28: Fixed reporting metric bindings in `Reports.jsx` across all 5 reports (Sales Margin, Production Yield, Inventory Valuation, Trial Balance, Journal Entries) so they accurately reflect the real metrics returned by the backend APIs. Rebuilt and restarted `thamanicraft-sales-service` and `thamanicraft-inventory-service`.
- [X] 2026-09-27: Implemented Ledgers (backend and frontend) similar to ThamaniPoint, including JPA entities (Account, JournalEntry, JournalLine) in craft-finance-service, DB migration V3, Trial Balance and Journal Entries views in Reports (using Tabs), and a manual entry modal. Verified via build. Dashboard and Settings UIs were also revamped to adopt ThamaniPoint styles.
- [X] 2026-09-27: Scoped and planned the implementation of Financial Ledgers based on ThamaniPoint. Created `docs/implement-ledgers.md` to guide double-entry ledger integration into `craft-finance-service` and frontend Reports.
- [X] 2026-09-26: Implemented Role-Based Access Control (RBAC) in Identity Service and Settings UI. Added Role Management tab in `Settings.jsx` to list and create custom roles with permissions. Mapped created roles to the User creation modal.
- [X] 2026-09-26: Enhanced User Management by adding Change Password capability for the currently authenticated user (added Profile tab in Settings) and Toggle User Status (Disable/Enable) capability for administrators in the User Management tab. Rebuilt and redeployed `thamanicraft-identity-service`.
- [X] 2026-09-26: Implemented Post-Preparation Cancellation & Settlement Workflow. Added `retained_deposit` to `sales.orders`. Created new backend API `/api/sales/orders/{id}/settle-cancellation` that safely scraps finished goods from inventory and marks the order as cancelled with a refund due based on the retained deposit. Added "Settle & Cancel Order" modal to `OrderEntry.jsx` blocking cancellation if batches are active.
- [X] 2026-09-26: Created implementation plan `docs/post-preparation-cancellation-plan.md` for dedicated post-preparation cancellation and settlement workflow.
- [X] 2026-09-26: Implemented Stage 7 (Actual Order Costs & Profit Margin Analysis). Added `costingSummary` computation in `SalesService.java` joining work-order batch costs (`public.production_batches`) and recipe standard costs against sales order lines. Created `OrderCostingSummary.jsx` component displaying selling subtotal, recipe estimated cost, actual batch cost, and color-coded gross margin %. Rebuilt and redeployed `thamanicraft-sales-service`.
- [X] 2026-09-26: Implemented Stage 6 (Delivery & Fulfillment Tracking with finished stock dispatch). Added Sales V7 migration, Inventory finished-products dispatch endpoint, Sales `InventoryDispatchClient`, and UI controls/modals in `OrderEntry.jsx` and `Sales.jsx`. 39/39 Sales tests and 8/8 Inventory tests passed. Rebuilt and redeployed both services.
- [X] 2026-09-26: Created comprehensive implementation plan `docs/fulfillment-and-costing-plan.md` for Stage 6 (Delivery & Fulfillment Tracking with finished stock dispatch) and Stage 7 (Actual Order Costs & Profit Margin Analysis).
- [X] 2026-09-26: Updated Archify architecture diagram (`thamanicraft-architecture.html`). Added 5 distinct database connection lines for all microservices (`Identity`, `Sales`, `Inventory`, `Production`, `Finance`) to PostgreSQL 16, separated `Identity` into `Security & Auth` boundary box, and passed 9/9 Archify validation.
- [X] 2026-09-26: Added finished product selection to order items (Sales V6 migration). Each order line can be toggled as a "Finished product" with a dropdown populated from inventory. Auto-fills description, unit and cost. Changed Finished Product creation modal to use a category dropdown instead of free-text input. Rebuilt and restarted sales service.
- [X] 2026-09-24: Fixed startup crash in `craft-production-service` caused by duplicate V6 migrations by renaming the inbox script to `V8__Inventory_Callback_Inbox.sql`. Fixed `42501` database ownership error in inventory adjustments by changing ownership to `thamanicraft_user`. Fixed deprecated `Tabs.TabPane` warning in `Inventory.jsx`.
- [X] 2026-09-24: Implemented actual production and inventory posting. Added V8 migration to inventory (finished_products, outbox), V6 to production (inbox). Created InventoryPostingService, outbox pollers, and RabbitMQ listeners for BatchCompleted, StockPosted, and StockPostFailed. Deducts materials, credits output, and records movements safely. Rebuilt and restarted production and inventory services.
- [X] 2026-09-24: Fixed Nginx routing to ignore port in Host header to properly route Vite HMR. Fixed compilation error in `OrderRecipeMappingTest.java` and SQL grammar bug in `generateWorkOrder` (mapped `i.description as product_name`). Rebuilt and restarted `thamanicraft-sales-service`.
- [X] 2026-09-24: Implemented durable order/work-order generation linkage. Added migrations for `craft-sales-service` and `craft-production-service`. Created `generateWorkOrder` API with idempotency keys. Added "Generate work order" UI on mapped order items for CONFIRMED orders.
- [X] 2026-09-24: Documented the "post-preparation cancellation" workflow to handle both physical output (inventory vs scrap) and financial settlement (retaining deposit vs refund) separately from stock deduction.
- [X] 2026-09-24: Added the always-on [handover/progress rule](../.agents/rules/handover-progress.md), linked from the core protocol. Requires paired documentation updates, evidence-based status and explicit remaining gaps. Documentation/rules only; link targets and whitespace checked.
- [X] 2026-09-24: Received user feedback emphasizing the need for recipe mapping before full payment to support "preparation before payment" and "cancellation after preparation". Confirmed that recipe mapping is already decoupled from payment (available for NEW/CONFIRMED orders).
- [X] 2026-09-24: Added `FinishedProduct` base entities in inventory service to store outputs separately from raw materials.
- [X] 2026-09-25: Updated `WorkOrderService.java` to support transitioning from `COMPLETION_FAILED` to `COMPLETED` for safe event retries.
- [X] 2026-09-25: Added UI in `WorkOrder.jsx` with polling to reflect `COMPLETION_PENDING` and a retry mechanism on failure (`COMPLETION_FAILED`).
- [X] 2026-09-25: Added `Finished Products` tab in `Inventory.jsx` allowing users to create and manage finished product outputs. Frontend API services added in `inventoryApi.js`.

Documentation update (2026-09-25): created the handover and reconciled superseded status notes. Running UI mapping source and Sales V4 were verified earlier today; the user's mapping visibility issue and authenticated acceptance remain unresolved.

## Initial Setup & Architecture Documentation

- [X] Created project directory `/home/bob2609/Projects/ThamaniCraft`
- [X] Defined complete PRD specification for Food & Craft Manufacturing ERP (`PRD.md`)
- [X] Authored SKILL-01 (Infrastructure & Docker)
- [X] Authored SKILL-02 (Multi-Tenancy & Security)
- [X] Authored SKILL-03 (Raw Materials & Multi-UOM Inventory)
- [X] Authored SKILL-04 (Recipe & BOM Engine)
- [X] Authored SKILL-05 (Production Work Orders & Batch Execution)
- [X] Authored SKILL-06 (B2B Wholesale & Dispatch)
- [X] Authored SKILL-07 (Automated Manufacturing Accounting)
- [X] Authored SKILL-08 (UI/UX Design System & Tokens)
- [X] Authored SKILL-09 (CapEx, Machinery & Overhead Amortization)
- [X] Authored SKILL-10 (ThamaniPoint Lessons Learned)
- [X] Authored ThamaniCraft UI Requirements & Screen Blueprints (`ThamaniCraft_UI_Requirements.md`)
- [X] Configured RabbitScout on dedicated port `3035`

## Next Implementation Phases

- [X] Phase 1: Vite + React Frontend Scaffolding (`thamanicraft-client-ui` and `thamanicraft-admin-ui`)
- [X] Phase 2: Docker Compose & Infrastructure Provisioning
  - Containerized the UI projects using multi-stage Docker builds.
  - Configured Nginx reverse proxy with tenant-aware routing.
  - Scaffolded robust gateway routing via Spring Cloud Gateway (`craft-gateway-service`) in a cluster (2 instances).
  - Configured custom Docker entrypoints with stylized ASCII banners.
  - Enforced `TZ=Africa/Dar_es_Salaam` timezone globally.
  - Verified Docker Compose builds and resolved Nginx routing issues.
- [X] Phase 3: Authentication, Identity Service & RBAC (JWT-based security)
  - [X] Created `craft-common-security` module for shared JWT verification and ThreadLocal contexts.
  - [X] Created `craft-identity-service` with PostgreSQL backend and Flyway schema.
  - [X] Implemented RBAC entities (Role, Permission, User) and AuthController in Identity Service.
  - [X] Defined `usePermissions` hook in `thamanicraft-client-ui` following `SKILL-14`.
  - [X] Implemented `Login.jsx` and Sidebar/Route guarding in Tenant UI.
  - [X] Integrated Identity Service with Nginx/Gateway routing (`/api/auth/**`).
- [ ] Phase 4: Spring Boot Microservices (`craft-production-service`, `craft-inventory-service`) API Logic
  - [X] Raw material, category and Unit of Measure APIs.
  - [X] Tenant-scoped duplicate-SKU checks and database uniqueness enforcement; additional stock is received through GRNs.
  - [X] Goods Receipt creation and history; selectable base/purchase UOM, conversion to material base units, and weighted-average costing.
  - [X] Inventory cost correction endpoint with adjustment permission checks, required reason, stale-cost/unit checks and an atomic audit record.
  - [X] Recipe list, detail, create, update, archive and costing preview APIs with tenant validation.
  - [X] Separate production Flyway history and recipe schema provisioning.
  - [ ] Production work order APIs and batch execution (see Phase 6).
- [ ] Phase 5: Recipe Builder, Real-Time COGS Sandbox & Manual Expense Register
  - [X] Recipe list and dedicated create/edit pages with navigation back to the list.
  - [X] Ingredient quantities in material base UOM, waste percentage and preparation-instruction textareas.
  - [X] Live ingredient, batch and per-output-unit costs; labor/energy overheads and target-margin pricing simulation.
  - [X] Inventory/Procurement-themed recipe pages.
  - [X] Browser-only what-if sandbox for temporary ingredient price overrides; inventory and saved recipe prices remain unchanged.
  - [X] Manual equipment purchase and expense register; recipe overheads explicitly entered per batch (supersedes automatic CapEx allocation).
- [ ] Phase 6: Batch Work Order Execution & Event Bus Integration
  - [X] Created [Production implementation plan](production-implementation-plan.md); planning-stage implementation is in progress.
  - [X] Draft create/edit, schedule, start and pre-start cancel APIs; tenant/permission checks, version protection and transition audit.
  - [X] Scheduling snapshots ingredient quantities, units, instructions and scaled recipe costs; start checks current availability without reserving or deducting stock.
  - [X] Production table with search/status filter, full-page draft form and detail/history page matching Inventory/Procurement colours.
  - [X] Finished-product mapping, actual consumption/output/scrap/cost recording, atomic inventory posting and reliable completion messaging. Completion is explicitly unavailable in the interim UI/API.
  - [ ] Draft, scheduled, in-progress and completed work order lifecycle.
  - [X] Recipe scaling, material availability checks and a batch ingredient/cost snapshot.
  - [ ] Actual yield and scrap recording with final unit-cost calculation.
  - [X] Reliable batch-completion events, idempotent raw-material deduction and finished-goods crediting.

## Customer Orders planning (2026-09-23)

### Payment-independent mapping (2026-09-24)

- [X] Saved [focused plan](payment-independent-production-plan.md). User confirmed mapping visibility but perceived a full-payment requirement; code inspection found no payment gate in UI/API.
- [X] Moved mapping above Payments, added explicit no-payment-required guidance and permission/status explanations; preserved existing eligibility and security checks.
- [X] 38 Sales tests passed; frontend policy test file, build and focused lint passed. Running UI source confirms mapping before Payments and the new guidance. Frontend-only runtime change; no migration or backend rebuild. Existing bundle warning remains.
- [ ] Authenticated unpaid/partially paid mapping save/reopen acceptance.
- [ ] Future preparation before full payment and cancellation after preparation must retain actual consumption, costs and payment history with explicit finished-goods disposition and settlement; current stock posting/cancellation-after-preparation workflows are not yet implemented.

### Order recipe mapping — deployed; acceptance pending

- [X] Saved [recipe mapping plan](order-recipe-mapping-plan.md).
- [X] Recipe selection per order line, explicit production-output factor and saved standard-cost snapshot implemented. Sales validates the active recipe through an authenticated Production API call; user-supplied costs are not trusted. Stale/cancelled order updates are rejected; order item edits clear mappings.
- [X] 32 Sales tests and 27 Production tests passed; frontend build/focused lint passed. Sales V4 mapping migration rehearsed with rollback, preserving existing order. Existing frontend bundle warning and a Production JVM test-channel warning remain.
- [ ] Authenticated mapping save/reopen, cross-service permission/error acceptance and browser layout checks.
- [X] Sales/Production rebuilt and recreated; Sales V4 applied and both services started normally. Existing order retained, zero mappings inserted by deployment. Backup verified at Postgres container `/tmp/thamanicraft-before-recipe-mapping-20260923.dump`; previous images tagged `before-recipe-mapping-20260923`.
- [X] Work-order generation and cross-references between sales items and production batches have been implemented across Sales and Production APIs. Finished-product mapping, inventory posting, and delivery remain pending.

### Payments — deployed; acceptance in progress (2026-09-23)

- [X] Saved [payment implementation plan](order-payments-implementation-plan.md).
- [X] Implemented payment receipts, append-only full corrections, balances/deposit shortfall/refund due, separate RECORD_PAYMENTS / REVERSE_PAYMENTS checks and payment dialogs/history/list filters. Receipts lock the order, deduplicate submission keys and reject overpayments; order edits cannot reduce totals below net paid.
- [X] Sales suite: 27 tests passed, including payment validation, replay/conflicting-key handling, overpayment, cancellation, tenant lookup and separate permission checks. Frontend build and focused lint passed (existing bundle-size warning).
- [X] Sales V3 and Identity V4 migrations rehearsed together in a rolled-back transaction; existing order retained. Backup verified at Postgres container path `/tmp/thamanicraft-before-payments-20260923.dump`; prior Sales/Identity images tagged `before-payments-20260923`.
- [X] Rebuilt/recreated Sales and Identity; verified Sales V3 and Identity V4 migration success and normal startup. Existing order retained, zero receipts inserted by deployment; Sales page returned 200.
- [ ] Authenticated payment create/reload/correction and role acceptance; real PostgreSQL concurrent payment/rollback tests. Current unit tests mock JDBC, so they do not prove database race handling.

### Lifecycle slice — deployed 2026-09-23

- [X] Forward Sales V2 migration adds readable order numbers, optimistic versions and order history; existing order/contact data is preserved.
- [X] New-order edit, confirmation and cancellation APIs with tenant-scoped row locks, stale-version rejection and PROCESS_SALES permission checks. Editing preserves booked customer snapshots; confirmed orders cannot be edited in this first slice.
- [X] Order detail actions, reasoned confirmation/cancellation dialogs, edit form, history and discount old/new audit. List defaults to open orders with status/overdue filters and order-number search.
- [X] Rehearsed Sales V2 in a rolled-back transaction, rebuilt/recreated Sales and verified Flyway V2 success and normal startup. The existing order was retained and assigned an order number/version. Orders page returned 200; unauthenticated API returned 403 (not authenticated acceptance).
- [X] Database backup verified readable at Postgres container path `/tmp/thamanicraft-before-sales-lifecycle-20260923.dump`, restricted permissions; prior Sales image retained as `thamanicraft-sales-service:before-lifecycle-20260923`. Additive migration permits application-image rollback without deleting new columns/history; database restore is not an automatic rollback step.
- [ ] Authenticated browser save/reopen, stale edits, permissions and cancellation acceptance; real database concurrency/rollback verification.
- [X] Sales test suite: 18 passed (including lifecycle guards, edit recalculation/audit and method permissions); frontend build and focused lint passed. Existing bundle-size warning remains. Mock-based tests do not establish database concurrency safety.
- [ ] Date-range filters, production linkage and later coordinated stages remain pending. Payment filters, receipts and balances shipped in the later Payments slice above.
- [X] Created [remaining Orders–Production linkage plan](order-production-linkage-plan.md): order lifecycle, payments, recipe/output mapping, durable linkage, actual production/stock posting, fulfilment and actual margins, followed by end-to-end verification.
- [X] Complete the approved coordinated plan. Lifecycle, payments, initial recipe mapping, and now **durable order-to-work-order generation (Sales V5, Production V5)** have shipped. Remaining scope includes actual production completion and delivery.
- [X] Agreed order intake: customer/contact details, order items and instructions, due date/time, collection/delivery, deposits and payment history.
- [X] Created [Customer Orders implementation plan](customer-orders-implementation-plan.md) and linked its sequencing to Production.
- [X] Agreed fixed order-level discount in TZS, entered directly during order creation for upfront negotiations; plan includes discounted totals, deposit/balance validation and audited later changes.
- [X] Quick customer creation from New order: mandatory name/phone only, automatic selection, optional details maintained later on Customers. Customer edits use version checks and do not rewrite order contact snapshots.
- [X] Separate Sales service with tenant-scoped customer create/list/edit and order create/list/detail; server-side discounted totals and duplicate-submission protection.
- [X] Order intake/detail and searchable due-date-ordered list, upfront fixed discount and agreed deposit; Customers maintenance page. Later slices added payments and lifecycle actions; production work-order links remain pending.
- [X] Implement order/customer records, due-date-sorted list, full-page entry/detail screens and payment recording; authenticated acceptance remains separately pending.
- [ ] Link confirmed order lines to work orders with duplicate-generation protection; actual cost and readiness depend on safe Production completion.
- [ ] Verify permissions, payment concurrency, balances, tenant isolation and authenticated browser flows.

Next implementation priority: resolve recipe-mapping visibility and authenticated lifecycle/payment/mapping acceptance, plus database concurrency verification; then finished-product/output mapping and work-order generation in the [coordinated plan](order-production-linkage-plan.md). Agreed deposits remain targets, distinct from net recorded receipts.

- [X] Sales migration rehearsal with temporary customer/order records succeeded and rolled back; client build and focused lint passed (existing bundle warning remains).
- [X] Sales: 10 tests passed, covering minimal customer validation, fixed discounts/deposits, contact snapshots, tenant/version checks, permissions and duplicate submissions. Sales and gateways deployed; Sales V1 applied successfully; Nginx configuration validated and reloaded.
- [X] Pre-deployment backup: Postgres container `/tmp/thamanicraft-before-sales-20260923.dump`, access restricted. Existing records preserved; migration rehearsal records rolled back.
- [ ] Authenticated browser quick-create/select/save/reopen and customer-maintenance verification. Payment acceptance remains pending; fulfilment and complete production execution are not yet implemented.

## Production planning verification (2026-09-23)

- [X] Confirmed the development database had no production_batches table because V1 was baselined. Added forward migration V4; rehearsal on copied recipe tables passed and rolled back all test records.
- [X] Client build and focused lint passed; existing large-bundle warning remains.
- [X] Production regression suite: 27 tests passed, including base-unit scaling, manual overhead snapshots, state guards, stale versions, shortages and method permissions.
- [X] Production service rebuilt and restarted; Flyway V4 applied successfully. Production and new-work-order page smoke checks returned 200; unauthenticated API returned 403. No test work orders were persisted.
- [X] Pre-migration backup saved in Postgres container at `/tmp/thamanicraft-before-work-orders-20260923.dump` with restricted permissions; existing data preserved.
- [ ] Authenticated browser work-order create/edit/schedule/start/cancel checks and stock-count verification.
- [ ] Completion and RabbitMQ failure/retry acceptance tests (implementation pending).

## Inventory and Procurement Updates

- [X] Sidebar order keeps Dashboard first; Assets & Overheads appears after Procurement, before Customers.
- [X] Goods Receipts history table and compact receive-goods modal.
- [X] Stock and reorder levels displayed in the material's Base UOM.
- [X] Receipts distinguish received quantity/unit from converted base quantity; prices are entered per selected received unit.
- [X] Fixed UOM JSON serialization of Hibernate proxies; added a regression test.
- [X] Development Eggs setup corrected from tray-based stock to pieces, retaining Tray of 30 as the purchase unit.
- [X] Inventory table shows cost per base unit and an Edit cost action.
- [X] Edit Raw Material includes an Edit cost shortcut beside the read-only cost field. Saving a correction updates that field while retaining other form edits.
- [X] Cost correction form includes unit-specific labels, inventory-value preview and a required reason. Stock quantities and historical receipts remain unchanged.
- [X] Audit table records old/new costs, base UOM, stock quantity, reason, user and timestamp (Flyway V7).

## Verification and Development Deployment

- [X] Resolved Nginx 502 after UI recreation: direct UI returned 200 while Nginx retained the previous container IP. Validated configuration and reloaded Nginx. Deployment requirement: reload Nginx after recreating UI/gateway containers; automatic upstream DNS refresh remains future hardening.
- [X] Inventory backend: 8 tests passed, covering UOM serialization, cost corrections, validation, tenant-scoped lookup, stale values and permissions.
- [X] Recipe backend tests and earlier authenticated recipe lifecycle/costing checks passed during implementation.
- [X] Client production build passed after the cost-editor shortcut update.
- [X] Focused lint passed for the cost correction component; full client lint still reports existing warnings.
- [X] Inventory service rebuilt and started; V7 applied successfully and audit table existence confirmed.
- [ ] Browser verification of the latest cost correction shortcut, save/cancel flow and retained material edits.
- [ ] Live authenticated cost correction and resulting recipe-cost refresh verification. No existing material prices were automatically corrected.
- [ ] Resolve remaining frontend warnings, including deprecated Tabs usage and Select Option usage; address the build's large-bundle warning.

## Recipe Costing and Manual Assets & Overheads

On 2026-09-22 the user approved a manual purchase-and-expense register instead of depreciation and forecast-based allocation. This replaces the earlier CapEx costing scope.

- [X] Add temporary ingredient-price overrides to the recipe costing sandbox without writing inventory prices.
- [X] Equipment purchase records: name, category, date, actual purchase amount, status, reference and notes.
- [X] Dated rent and other expenses: description, category, date, amount, reference and notes; tenant-scoped read/create/edit with Finance permissions.
- [X] Remove depreciation, book-value calculations, expected monthly batches and automatic overhead allocation from the active API/UI.
- [X] Preserve existing asset data and show historical lease agreements read-only when present. Agreements are not automatically converted into paid expenses.
- [X] Recipe total = ingredient cost + entered labour + entered energy + entered additional overhead per batch. Existing recipes default additional overhead to zero.
- [X] Remove the recipe runtime dependency on Finance. Saving a recipe still does not consume stock or alter inventory prices.
- [X] Automated verification: 7 Finance tests and 11 Production tests pass, including explicit overhead create/edit/read and validation; frontend simulation test file, build and focused lint passed. Existing large-bundle warning remains.
- [X] Finance V2 and Production V3 SQL verified against copied existing tables in a rolled-back transaction; new manual records and existing-recipe zero defaults verified.
- [X] Development deployment: Finance and Production rebuilt/recreated; Finance V2 and Production V3 successfully applied and queried in Flyway history. Both existing recipes retained zero manual overhead. Assets and recipe page HTTP smoke checks returned 200; unauthenticated expense API returned 403.
- [X] Pre-migration database backup saved inside the Postgres container at `/tmp/thamanicraft-before-manual-register-20260922.dump`. No existing records were cleared.
- [ ] Authenticated browser acceptance: purchase/expense create-edit-reload, recipe overhead save-reopen, current costs and simulation/reset.

Approved scope: manual recordkeeping, no production forecasts, no depreciation and no accounting journals. The prior [ADR-001](architecture/adr-001-capex-costing.md) allocation policy is superseded; see [manual register plan](../manual-cost-register.md).

Orders now support recipe selection, explicit output scaling and standard-cost snapshots. Still pending: actual order costs such as delivery expense and comparison of actual total cost with selling price. Recipe-standard costs must be distinguished from actual recorded costs, and historical snapshots must not change when inventory prices or recipes change. Avoid counting a cost both in recipe overhead and again as an order extra.

Next: close existing acceptance gaps, then complete Production linkage and execution as summarised in HANDOVER. ROI, depreciation and forecast-based allocation are out of the approved scope.

Acceptance example: ingredients TZS 45,900 + labour 15,000 + energy 10,000 + manually entered overhead 5,500 = TZS 76,400 per batch, or TZS 1,528 for each of 50 output units. Recording an oven purchase or rent expense must not change that recipe total.

- [X] Fixed 403 Forbidden on failed login by introducing `GlobalExceptionHandler` in `craft-common-security` and returning 401 ProblemDetail.
- [X] Added "Security" tab to `Settings.jsx` to allow authenticated users to change their password via the UI.
- [X] Identified that the default admin password changed to `password` due to the recent identity service database migration (`V2__init_identity_schema.sql`).
- [X] Updated UI reports for Trial balance, fixed the 'Failed to load report data' error by appending VIEW_REPORTS role check on LedgerController APIs.
- [X] Updated Dashboard UI dark mode colors using useTheme and custom variables.
- [X] Added toggleable Double-Entry View to Journal Entries report in UI.
- [X] 2026-09-28: Fixed missing `createdAt`, `targetQuantity`, `actualYield`, and `scrapQuantity` fields in backend list queries (`SalesService`, `WorkOrderService`) which caused Reports and Dashboard filtering/stats to break. Rebuilt Docker containers so API changes take effect.
- [X] 2026-09-28: Corrected field mapping mismatches in `Dashboard.jsx` and `Reports.jsx` (changed `totalAmount` to `total`, removed invalid `lines` reads) to restore Dashboard charts and top products, and Reports data. Fixed a Javascript ReferenceError (`colors is not defined`) in `Dashboard.jsx` that was causing the entire dashboard to blank out.
- [X] 2026-09-28: Added direct Work Order navigation link in `OrderEntry.jsx` order items table so users can jump to generated work orders directly from Sales & Dispatch.
- [X] 2026-09-28: Hid recipe mapping for finished products in `OrderRecipeMapping.jsx`. Order items that are already finished products do not require production mapping and are now properly filtered out with a clear info alert.
- [X] 2026-09-28: Implemented a global date filter in `Dashboard.jsx` (7D, 30D, 3M, 6M, 1Y) which dynamically updates all sales aggregates and charts. Added two new Pie Charts for "Sales Status Breakdown" and "Work Order Status".
- [X] 2026-09-30: Fixed Flyway migration failure (V9) causing 502 Bad Gateway errors by removing incorrect schema prefix. Fixed frontend React deprecation warnings for `maskClosable`.
