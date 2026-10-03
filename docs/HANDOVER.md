# ThamaniCraft — Development Handover

Last updated: 2026-09-24 (Africa/Dar_es_Salaam).

## Start here

The application has inventory/receiving, recipes, manual expenses, customer orders, manual payments and order-to-recipe mapping. Production currently supports planning and work-order generation from confirmed sales orders. **Production does not yet deduct raw materials, and delivery/collection completion is not implemented.**

This is the current-state handover. [PROGRESS.md](PROGRESS.md) holds detailed implementation and verification evidence; feature plans hold remaining tasks. A feature being deployed does not mean its authenticated browser workflow is verified.

## Maintenance agreement

The mandatory update workflow is defined in [handover-progress](../.agents/rules/handover-progress.md), linked from the core protocol. Follow it for every project change or finding that changes documented status: update this handover, PROGRESS and affected plans before handing work back. It distinguishes implementation, deployment and verification, and requires unresolved gaps to stay visible.

## Implemented and deployed

| Area | Available functionality | Important limits |
| --- | --- | --- |
| Identity/infrastructure | Tenant-aware JWT security, permissions, gateway/Nginx routing and Docker development stack | Permissions must be enforced in APIs, not only hidden UI controls |
| Inventory/procurement | Raw materials, categories, UOMs, tenant-specific unique SKU, GRN history/entry, receipt unit conversion, weighted-average costs and audited cost corrections | Stock is displayed in material base UOM; do not silently reinterpret existing balances or prices |
| Recipes & BOM | Dedicated new/edit pages, ingredient quantities/instructions, waste, ingredient/labour/energy/manual overhead costing and browser-only pricing simulation | Saving a recipe does not consume stock; simulation does not change saved inventory prices |
| Assets & Overheads | Manual equipment purchases and dated expenses | No depreciation, projected monthly batches or automatic allocation into recipes |
| Customers/orders | Inline customer creation with name/phone, later maintenance, contact snapshots, items, due time, collection/delivery preference, fixed TZS discount and agreed deposit | Fulfilment preference is not evidence of completed delivery |
| Order lifecycle | Readable numbers, edit New orders, confirm, cancel with reasons, version protection, history and discount audit; open/status/overdue filters | Confirmed orders are read-only. Cancelled orders remain in history. No reopen/undo action |
| Payments | Manual receipts, payment method/time/reference, net received, balance, deposit shortfall, payment filters and reasoned full receipt corrections | Recording-error reversal is not a real refund; cancelled paid orders show refund due. No bank/mobile-money verification |
| Order recipe mapping | Active recipe per order line, explicit output per sales unit, planned output and saved standard-cost snapshot | Editing order items clears mappings; finished-product mapping remains pending |
| Production planning | Draft create/edit, schedule, start, pre-start cancel, recipe snapshots, scaled quantities/costs, advisory availability and history. Includes idempotent generation from sales order items. | No material reservation/deduction, actual output, finished-stock credit or completion posting |

### Where to find order actions

Go to **Sales & Dispatch → Open an existing order**.

- Edit/Confirm/Cancel are above the order details, subject to status and Sales permissions.
- Payments is below the order summary.
- **Production recipe mapping is above Payments**, before Order history. Click Map recipe on a line.
- Mapping is not a sidebar entry and is not present in the New/Edit order form. Mapping actions require NEW/CONFIRMED status and PROCESS_SALES plus VIEW_RECIPES; OWNER bypasses these permission checks.
- RECORD_PAYMENTS and REVERSE_PAYMENTS are separate permissions. OWNER receives them; other staff require explicit grants and a fresh login token.

## Current unresolved issue / first action

On 2026-10-02, we implemented the automatic "Just-In-Time" (JIT) inventory deduction for Point-of-Sale (POS) made-to-order items. For standard sales, inventory is deducted during the explicit Work Order production phases. However, for POS sales where items are sold instantly, we introduced an asynchronous `SalesEventListener` in the `craft-production-service`. It listens for `OrderFulfillment` events of type `JUST_IN_TIME`, instantly snapshots a silent Work Order, and marks it `COMPLETION_PENDING` while sending a payload with `finishedProductId: null`. This correctly deducts raw materials in the `craft-inventory-service` without falsely inflating finished goods.

Earlier, bugs in the Dashboard and Reports related to missing mapping of backend fields (`createdAt`, `targetQuantity`, `actualYield`, `scrapQuantity`) and misaligned frontend properties (`totalAmount` vs `total`) have been resolved. The missing mappings caused missing data and a JS ReferenceError which blanked out the dashboard.

In a later session, we corrected the Flyway migration conflict in the `craft-inventory-service` (V3 vs V9 duplication) which was causing a 500 server error, and verified that both Revenue and Gross Profit render cleanly on the Dashboard charts. The unit cost logic for sales items dynamically computes from the Inventory, enabling actual profit calculation. Finally, we stripped out deprecated `hibernate.dialect` settings from backend configuration files.

Currently, we should monitor if authenticated browser access flows normally, especially around Production recipe mapping (which has been disabled for finished products), order generation, and the dashboard metrics loading correctly.

## Pending implementation and recommended sequence

Use the [coordinated Orders–Production plan](order-production-linkage-plan.md). Do not mark its full stages complete merely because one slice shipped.

1. **Close acceptance gaps:** order create/edit/confirm/cancel; inline customer creation; payment receipt/replay/correction; recipe mapping save/reopen; tenant and permission failures. Exercise payment locking, rollback and concurrent overpayments against real PostgreSQL—not only mocked JDBC.
2. **Complete output mapping:** add minimal finished-product identity and compatible recipe/output UOM mapping. Preserve the explicit conversion from sales units to recipe output; reconcile mapping quantity precision with work-order input precision before generation.
3. **Generate linked work orders:** (Implemented 2026-09-24) confirmed order lines only; persist order/line references and generation intent, show reciprocal navigation/status and prevent duplicates across retries or timeouts.
4. **Implement actual production and inventory posting:** actual consumption, good output, scrap, labour/energy/manual overhead and extras. Inventory atomically checks/deducts materials and credits good output, with immutable movements and cost snapshots. Use transactional outbox, durable results, deduplication and visible retry/failure states. Mark Completed only after inventory confirms success.
5. **Readiness and handover:** allocate confirmed finished output once, require sufficient good output for every line, then record collection/delivery date, actor and reference. Idempotent dispatch deducts finished goods—not raw materials again. No partial deliveries initially.
6. **Actual order costs/margin:** attributed batch costs plus explicit order extras such as delivery expense. Keep customer delivery charge as revenue, discount as a revenue reduction, and standard estimates separate from actual costs; avoid double-counting overhead.

Each implementation slice should include backend, UI, tests, migration rehearsal, deployment checks and updates to this handover. Do not enable stock-affecting buttons before safe posting is implemented.

## Business rules to preserve

- Base-UOM consistency: eggs consumed as pieces, trays as purchase units where configured. A recipe using 5 eggs must not consume 5 trays.
- Order total = item subtotal + customer delivery charge − fixed discount amount. Discounts can be negotiated at order entry; no percentage required.
- Agreed deposit is a target, not received money. Payment status and production/fulfilment status are independent.
- No automatic production on payment or confirmation. Current confirmation locks order editing; cancellation does not delete records or issue refunds.
- Manual cost policy: no depreciation, production forecasts, automatic Finance allocation or accounting journals. Earlier CapEx allocation designs are superseded.
- Current mapping snapshot is planned cost only; later batch actuals must remain separately labelled.
- Preserve existing data and historical snapshots. Never clear the database or rewrite applied migrations as a normal implementation step.

## Verification and deployment baseline

2026-09-24 payment-independent mapping update: 38 Sales tests passed; frontend policy test file, build and focused lint passed. Served UI source confirms mapping before Payments and the no-payment-required message. Frontend bind mount serves the change; no backend runtime change or migration. Authenticated unpaid/partial-payment mapping save/reopen remains pending.

Most recent recorded suites: **32 Sales tests, 27 Production tests**, client build and focused lint passed during recipe-mapping work on 2026-09-23. Earlier Inventory and Finance suites passed 8 and 7 tests respectively; these are historical results, not fresh full-stack runs. Existing bundle-size warning, older frontend warnings and a Production JVM test-channel warning are documented in PROGRESS.

Authenticated browser acceptance remains outstanding for recent order lifecycle, payments, mapping and production-planning flows. Payment concurrency/rollback acceptance with real PostgreSQL is also outstanding. Full end-to-end order → production → inventory → delivery testing cannot pass until those features exist.

Last recorded migration levels (recheck live history before future migrations):

| Service | Migration |
| --- | --- |
| Sales | V6 finished product on order items (V1 intake, V2 lifecycle, V3 payments, V4 recipe mapping, V5 work-order linkage) |
| Production | V4 work-order planning |
| Inventory | V7 cost corrections |
| Identity | V4 payment permissions |
| Finance | V2 manual register |

Sales and Production were rebuilt/recreated for mapping on 2026-09-23. Sales V4 and service startup succeeded; existing orders were preserved, and deployment inserted no mapping fixtures. On 2026-09-24 the running UI source and Sales V4 were checked again; authenticated save/reopen was not tested.

Latest recorded backup: PostgreSQL container path `/tmp/thamanicraft-before-recipe-mapping-20260923.dump`. Sales/Production rollback image tags: `before-recipe-mapping-20260923`. Earlier payment backup: `/tmp/thamanicraft-before-payments-20260923.dump`, with Sales/Identity image tags `before-payments-20260923`. These container-local backups are not durable off-host backups; verify availability before relying on them. Take a fresh backup before the next migration. Do not restore a database automatically as part of application rollback.

## Technical orientation

- Client: React/Vite/AntD in `thamanicraft-client-ui`; current Compose runs bind-mounted Vite, so UI source updates can appear before backend deployment.
- Backend: Java 21/Spring Boot services, common JWT/TenantContext security, PostgreSQL/Flyway, RabbitMQ. Sales uses its own `sales` schema; inspect each service's Flyway configuration rather than assuming all share one history.
- Key UI files: `src/pages/OrderEntry.jsx`, `Sales.jsx`, `WorkOrder.jsx`; `src/components/OrderPayments.jsx`, `OrderRecipeMapping.jsx`.
- Key Sales classes: `SalesService`, `PaymentService`, `OrderRecipeMappingService`, `ProductionRecipeClient`. Production: `RecipeService`, `WorkOrderService`.
- Mapping validation forwards the caller's bearer token to Production's recipe API. Do not trust client-supplied costs, units or tenant identifiers.
- Existing worktree contains extensive uncommitted changes and tracked build artifacts. Preserve unrelated work; inspect diffs before editing or committing.
- UI colours/layout should remain consistent with Inventory/Procurement. New/Edit large forms use full pages; focused actions use compact dialogs.
- Rebuild backend containers for Java changes. After UI/gateway container recreation, validate/reload Nginx; stale upstream IPs previously caused 502 errors.
- Example checks: `mvn -o -f craft-sales-service/pom.xml test`, corresponding Production tests, `npm --prefix thamanicraft-client-ui run build`, focused client lint. Read-only HTTP smoke tests are useful but do not prove authenticated functionality.

## Related plans

- [Progress and evidence](PROGRESS.md)
- [Coordinated remaining work](order-production-linkage-plan.md)
- [Customer orders](customer-orders-implementation-plan.md)
- [Payments](order-payments-implementation-plan.md)
- [Order recipe mapping](order-recipe-mapping-plan.md)
- [Production execution](production-implementation-plan.md)
- [Implement Financial Ledgers](implement-ledgers.md)

## Handover change log

- **2026-09-28:** Fixed 403 Forbidden error on failed login by introducing a `GlobalExceptionHandler` in `craft-common-security` to properly catch `RuntimeException` and return a 401 Unauthorized ProblemDetail, preventing the `DispatcherServlet` from forwarding to the unpermitted `/error` endpoint. Rebuilt and redeployed `thamanicraft-identity-service`. Also discovered and notified that the default admin password in DB migration `V2__init_identity_schema.sql` was changed to `password` (was `admin` in previous `init.sql`). Added a "Security" Tab in the `Settings.jsx` page with a "Change Password" form linked to the `changePassword` endpoint.

- **2026-09-27:** Addressed UI feedback. Replaced Dropdown with Tabs in Reports, fixed dark-mode visibility of Dashboard glass panels, and resolved "Failed to load report data" for ledgers by rebuilding `craft-finance-service` to run missing `V3__Ledger.sql` Flyway migrations.

- **2026-09-27:** Implemented Financial Ledgers similar to ThamaniPoint, including JPA entities (`Account`, `JournalEntry`, `JournalLine`) in `craft-finance-service`, DB migration V3, Trial Balance and Journal Entries views in Reports, and a manual entry modal. Verified via build.

- **2026-09-27:** Scoped and planned the implementation of Financial Ledgers based on ThamaniPoint implementation. Created `docs/implement-ledgers.md`.

- **2026-09-26:** Enhanced User Management by adding Change Password capability for the currently authenticated user (added Profile tab in Settings) and Toggle User Status (Disable/Enable) capability for administrators in the User Management tab. Rebuilt and redeployed `thamanicraft-identity-service`.

- **2026-09-26:** Implemented Dashboard, Reports, and Settings modules. The Dashboard aggregates key metrics (Pending Sales, Active Batches, Low Stock Alerts) directly from the client. The Reports module provides Sales Margin, Production Yield, and Inventory Valuation tabular data with CSV export functionality. The Settings module features General configuration, Role Management (for RBAC) and User Management, which interacts with the newly added `UserController` in the `craft-identity-service` (routed under `/api/auth/users`) for user creation, role assignment, and status toggling. Fixed inventory dispatch port issue in `craft-sales-service`.

- **2026-09-26:** Implemented Post-Preparation Cancellation & Settlement Workflow. Added `retained_deposit` to `sales.orders` via V8 migration. Added `/api/sales/orders/{id}/settle-cancellation` endpoint to `craft-sales-service`. The new endpoint records the settlement, updates the refund due based on the retained deposit, and if requested, safely dispatches (writes-off) any generated finished stock from the inventory using the `InventoryDispatchClient`. Updated `OrderEntry.jsx` with a "Settle & Cancel Order" modal, which enforces production completion by blocking cancellation if linked work orders are still `IN_PROGRESS` or `COMPLETION_PENDING`. Rebuilt and redeployed `thamanicraft-sales-service`.

- **2026-09-26:** Implemented Stage 7 (Actual Order Costs & Profit Margin Analysis). Updated `SalesService.java` to compute order `costingSummary` by joining completed `production_batches` costs and recipes standard costs against order lines. Created `OrderCostingSummary.jsx` component displaying selling subtotal, recipe standard cost, actual batch cost, and color-coded gross profit margins (%). Rebuilt and redeployed `thamanicraft-sales-service`.

- **2026-09-26:** Implemented Stage 6 (Delivery & Fulfillment Tracking with finished stock dispatch). Added Flyway V7 migration to `craft-sales-service` (`fulfillment_status`, `fulfilled_at`, `fulfilled_by`, `carrier_or_collector`, `fulfillment_notes`), `POST /finished-products/{id}/dispatch` endpoint in `craft-inventory-service` with `FINISHED_GOODS_DISPATCH` adjustments, and `InventoryDispatchClient` in `craft-sales-service`. Updated client UI (`OrderEntry.jsx`, `Sales.jsx`) with fulfillment tags, details, and dispatch modal. Rebuilt and redeployed both services (39/39 Sales tests passed, 8/8 Inventory tests passed).

- **2026-09-26:** Authored `docs/fulfillment-and-costing-plan.md` for Stage 6 (Delivery & Fulfillment Tracking) and Stage 7 (Actual Order Costs & Profit Margin Analysis).

- **2026-09-26:** Updated Archify architecture diagram spec (`docs/thamanicraft.architecture.json`) and regenerated `thamanicraft-architecture.html`. Added individual database connection lines for all 5 microservices (`Identity`, `Sales`, `Inventory`, `Production`, `Finance`) to `PostgreSQL 16`, separated `Identity` into a `Security & Auth` boundary box, and routed all event bus and DB connections cleanly (9/9 Archify validation passed).

- **2026-09-26:** Added finished product selection to order items. Each order line can be toggled as a "Finished product" with a dropdown populated from inventory. Auto-fills description, unit and cost. Backend stores `finished_product_id` and `finished_product_name` on `order_items` (V6 migration). Changed Finished Product creation modal to use a category dropdown instead of free-text input.

- **2026-09-26:** Resolved 403 Forbidden error on Finished Products page by rebuilding `thamanicraft-inventory-service` container which was missing `FinishedProductController` and forwarding 404s to protected `/error` endpoints.

- **2026-09-24:** Fixed startup crash in `craft-production-service` caused by duplicate V6 migrations by renaming the inbox script to `V8__Inventory_Callback_Inbox.sql`. Fixed `42501` database ownership error in inventory adjustments by changing ownership to `thamanicraft_user`. Fixed deprecated `Tabs.TabPane` warning in `Inventory.jsx`.

- **2026-09-25:** Added `Finished Products` tab in `Inventory.jsx` allowing users to create and manage finished product outputs. Frontend API services added in `inventoryApi.js`. Updated `WorkOrderService.java` to support transitioning from `COMPLETION_FAILED` to `COMPLETED` for safe event retries, and added UI in `WorkOrder.jsx` with polling to reflect `COMPLETION_PENDING` and a retry mechanism on failure (`COMPLETION_FAILED`).

- **2026-09-24:** Implemented actual production and inventory posting. Added V8 migration to inventory (finished_products, outbox), V6 to production (inbox). Created `InventoryPostingService`, outbox pollers, and RabbitMQ listeners for `BatchCompleted`, `StockPosted`, and `StockPostFailed`. Deducts materials, credits output, and records movements safely. Rebuilt and restarted production and inventory services.

- **2026-09-24:** Fixed Nginx regex routing to support WebSocket/HMR and proxying for Vite (allowing port in Host header). Fixed `OrderRecipeMappingService.java` SQL grammar error (incorrect column `product_name` instead of `description`) that was causing a 500 error on work order generation. Rebuilt and restarted the sales service successfully.

- **2026-09-24:** Implemented durable order/work-order linkage across Sales and Production APIs (V5 migrations). Added `generateWorkOrder` with idempotency, and updated `OrderRecipeMapping.jsx` to allow generating work orders for confirmed orders.

- **2026-09-24:** User feedback emphasized the need for recipe mapping before full payment, to handle scenarios where orders are prepared before payment, and potential cancellation after preparation. Confirmed that mapping is already payment-independent and only requires NEW/CONFIRMED status. The next major implementation steps are production actuals, stock posting, and the dedicated post-preparation cancellation workflow.

- **2026-09-24:** Planned and implemented payment-independent mapping visibility: mapping above Payments, explicit eligibility explanation and regression tests. Backend payment eligibility was already independent; no runtime backend change or migration needed. Preparation before full payment and cancellation after preparation are approved future scope in [the focused plan](payment-independent-production-plan.md); stock/cost history must be retained, with explicit disposition and settlement.

- **2026-09-24:** Added the always-on handover/progress rule and linked it from the core protocol. Centralised the maintenance workflow there; documentation/rules only, no runtime changes. Paths and whitespace checked.

- **2026-09-24:** Created this handover and maintenance agreement. Consolidated shipped capabilities, deployment/test evidence, mapping visibility issue and recommended remaining sequence. Documentation-only change; no service restart, database migration or runtime change.
- **2026-09-28:** Fixed missing fields (`createdAt`, `targetQuantity`, `actualYield`, `scrapQuantity`) in `SalesService` and `WorkOrderService` list queries. Corrected field mapping mismatches in `Dashboard.jsx` and `Reports.jsx` (`totalAmount` -> `total`) to restore functionality to the dashboard charts and reports. Added a direct navigation link from `OrderEntry.jsx` items table to their generated work orders. Hid recipe mapping for finished products in `OrderRecipeMapping.jsx` to prevent mapping inventory that does not require production. Rebuilt and restarted both `thamanicraft-sales-service` and `thamanicraft-production-service`.
- **2026-09-28:** Implemented decoupled Selling Price for Finished Products. Added `selling_price` to `finished_products` (inventory service) and `unit_cost` to `order_items` (sales service). Updated Inventory UI to allow managing the selling price. Updated Sales UI and Service to automatically capture the default selling price and unit cost during order entry, properly rolling up costs to `standardCost` and `actualCost` to correctly calculate profit margin for finished product sales. Also fixed mapping issues across all 5 reports in `Reports.jsx` so they reflect actual backend data metrics.
- **2026-09-29:** Resolved the inventory 500 error by addressing a Flyway migration cache issue (cleaning the container build layer) in `craft-inventory-service`. Improved `Dashboard.jsx` to correctly map `Revenue` and `Gross Profit` as two distinct chart lines. Addressed Hibernate `hibernate.dialect` deprecation warnings by stripping the configuration out of all backend yaml files. Rebuilt and successfully brought up the UI, Inventory, and Production containers.
- **2026-09-30:** Fixed the UI incorrectly displaying "DRAFT" for work orders in the Order Costing Summary by successfully rebuilding the `craft-sales-service` backend, allowing the newly added `COALESCE` query to return the correct "COMPLETED" status. Corrected the profit margin calculation logic in `OrderCostingSummary.jsx` to explicitly check for `null` API values instead of evaluating `0` as falsey. This prevents uncosted custom items from artificially inflating the gross profit margin. Rebuilt and successfully brought up the UI and Sales containers.
- **2026-09-30:** Resolved work order status synchronization and recipe mapping issues for custom items. Implemented a `BatchCompleted` RabbitMQ event listener in `craft-sales-service` to update `work_order_status` to `COMPLETED` when the production batch finishes. Configured `RABBITMQ_HOST` in `docker-compose.yml` for the sales service. Fixed a silent failure in `SalesService.java` where a slow response from the production service during recipe fetch would silently drop the custom item's recipe mapping, resulting in uncosted items. By removing the try-catch block, the transaction now properly fails (allowing retry) rather than saving broken data. Rebuilt and restarted `thamanicraft-sales-service`.

- **2026-09-30:** Replaced the sandbox "Target margin" in the Recipe Editor with a real, persisted database field (`target_margin`). Added a V9 migration to `craft-production-service` to store it, and updated the frontend `RecipeEditor.jsx` to feature a bi-directional calculator: typing a margin percentage instantly computes the suggested selling price, and typing a flat selling price reverse-calculates the margin percentage. In `OrderEntry.jsx`, selecting a base recipe for a custom item now automatically sets the order line's `unitPrice` to this exact suggested price instead of the raw batch cost. Rebuilt and restarted both production and sales services, as well as the UI.
- **2026-09-30:** Fixed Flyway migration failure (`V9__Recipe_Target_Margin.sql`) in `craft-production-service` by removing the incorrect `production.` schema prefix. Replaced deprecated `maskClosable` occurrences across React UI files with `mask={{ closable: ... }}`. Rebuilt `craft-production-service` and reloaded the Nginx gateway to resolve the 502 Bad Gateway and React warnings.
