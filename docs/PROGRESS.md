# ThamaniCraft Implementation Progress

Last updated: 2026-09-23. Checked items indicate implemented functionality; verification gaps are listed separately below.

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
  - [ ] Finished-product mapping, actual consumption/output/scrap/cost recording, atomic inventory posting and reliable completion messaging. Completion is explicitly unavailable in the interim UI/API.
  - [ ] Draft, scheduled, in-progress and completed work order lifecycle.
  - [X] Recipe scaling, material availability checks and a batch ingredient/cost snapshot.
  - [ ] Actual yield and scrap recording with final unit-cost calculation.
  - [ ] Reliable batch-completion events, idempotent raw-material deduction and finished-goods crediting.

## Customer Orders planning (2026-09-23)

### Payments — in progress (2026-09-23)

- [X] Saved [payment implementation plan](order-payments-implementation-plan.md).
- [ ] Payment receipts, append-only corrections, balances/deposit shortfall, permission checks and payment UI.
- [ ] Verification, migration rehearsal, deployment and authenticated acceptance.

### Lifecycle slice — deployed 2026-09-23

- [X] Forward Sales V2 migration adds readable order numbers, optimistic versions and order history; existing order/contact data is preserved.
- [X] New-order edit, confirmation and cancellation APIs with tenant-scoped row locks, stale-version rejection and PROCESS_SALES permission checks. Editing preserves booked customer snapshots; confirmed orders cannot be edited in this first slice.
- [X] Order detail actions, reasoned confirmation/cancellation dialogs, edit form, history and discount old/new audit. List defaults to open orders with status/overdue filters and order-number search.
- [X] Rehearsed Sales V2 in a rolled-back transaction, rebuilt/recreated Sales and verified Flyway V2 success and normal startup. The existing order was retained and assigned an order number/version. Orders page returned 200; unauthenticated API returned 403 (not authenticated acceptance).
- [X] Database backup verified readable at Postgres container path `/tmp/thamanicraft-before-sales-lifecycle-20260923.dump`, restricted permissions; prior Sales image retained as `thamanicraft-sales-service:before-lifecycle-20260923`. Additive migration permits application-image rollback without deleting new columns/history; database restore is not an automatic rollback step.
- [ ] Authenticated browser save/reopen, stale edits, permissions and cancellation acceptance; real database concurrency/rollback verification.
- [X] Sales test suite: 18 passed (including lifecycle guards, edit recalculation/audit and method permissions); frontend build and focused lint passed. Existing bundle-size warning remains. Mock-based tests do not establish database concurrency safety.
- [ ] Date-range/payment filters, payment receipts and balances, production linkage and all later coordinated stages remain pending.

- [X] Created [remaining Orders–Production linkage plan](order-production-linkage-plan.md): order lifecycle, payments, recipe/output mapping, durable linkage, actual production/stock posting, fulfilment and actual margins, followed by end-to-end verification.
- [ ] Implement that coordinated plan after approval. This update is documentation-only; no new runtime functionality, migrations or deployment are claimed.

- [X] Agreed order intake: customer/contact details, order items and instructions, due date/time, collection/delivery, deposits and payment history.
- [X] Created [Customer Orders implementation plan](customer-orders-implementation-plan.md) and linked its sequencing to Production.
- [X] Agreed fixed order-level discount in TZS, entered directly during order creation for upfront negotiations; plan includes discounted totals, deposit/balance validation and audited later changes.
- [X] Quick customer creation from New order: mandatory name/phone only, automatic selection, optional details maintained later on Customers. Customer edits use version checks and do not rewrite order contact snapshots.
- [X] Separate Sales service with tenant-scoped customer create/list/edit and order create/list/detail; server-side discounted totals and duplicate-submission protection.
- [X] Order intake/detail and searchable due-date-ordered list, upfront fixed discount and agreed deposit; Customers maintenance page. Payment receipts, order editing/status changes and production links are not yet enabled.
- [ ] Implement order/customer records, due-date-sorted list, full-page entry/detail screens and payment recording.
- [ ] Link confirmed order lines to work orders with duplicate-generation protection; actual cost and readiness depend on safe Production completion.
- [ ] Verify permissions, payment concurrency, balances, tenant isolation and authenticated browser flows.

Next implementation priority: authenticated lifecycle acceptance, then payment recording (stage 2 of the [coordinated plan](order-production-linkage-plan.md)). Recipe/output mapping, Production linkage and safe batch completion follow. Agreed deposits are not payments; no payment balance is represented as verified.

- [X] Sales migration rehearsal with temporary customer/order records succeeded and rolled back; client build and focused lint passed (existing bundle warning remains).
- [X] Sales: 10 tests passed, covering minimal customer validation, fixed discounts/deposits, contact snapshots, tenant/version checks, permissions and duplicate submissions. Sales and gateways deployed; Sales V1 applied successfully; Nginx configuration validated and reloaded.
- [X] Pre-deployment backup: Postgres container `/tmp/thamanicraft-before-sales-20260923.dump`, access restricted. Existing records preserved; migration rehearsal records rolled back.
- [ ] Authenticated browser quick-create/select/save/reopen and customer-maintenance verification. Payment, fulfilment and production workflows remain pending.

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

Future Orders requirement (not implemented): select and scale the recipe used; record additional order costs such as delivery; compare total cost with selling price. Recipe-standard costs must be distinguished from actual recorded costs, and historical order cost snapshots must not change when inventory prices or recipes change. Avoid counting a cost both in recipe overhead and again as an order extra.

Next: Customer Orders intake and payments, then Production linkage and completion; existing browser acceptance gaps remain listed above. ROI, depreciation and forecast-based allocation are out of the approved scope.

Acceptance example: ingredients TZS 45,900 + labour 15,000 + energy 10,000 + manually entered overhead 5,500 = TZS 76,400 per batch, or TZS 1,528 for each of 50 output units. Recording an oven purchase or rent expense must not change that recipe total.
