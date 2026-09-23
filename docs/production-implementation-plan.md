# Production Work Orders & Batch Execution — Implementation Plan

Status: implementation in progress (2026-09-23). Work-order planning APIs and pages implemented; completion, actuals and inventory posting are not yet implemented.

Remaining cross-service work is sequenced in the [Orders–Production linkage plan](order-production-linkage-plan.md). Implementation is approved and starts with Sales lifecycle work; the production execution rules below remain applicable.

Sequencing update: plan and implement [Customer Order intake and payments](customer-orders-implementation-plan.md) next, then connect confirmed order lines to work orders while completing inventory posting. Generated batches need durable order/line references and duplicate-generation protection. Orders must not be marked ready solely because a batch has started.

### Current delivery

Draft create/edit, schedule (refresh/freeze recipe snapshot), start with advisory stock checks, cancel before starting, version checks and transition history are implemented. The full-page UI shows saved ingredient requirements, planned costs and availability. It explicitly warns that no stock is reserved or deducted and completion is unavailable. Do not use this interim version to record real completed production.

Production V4 creates batch tables where the baselined V1 did not run. Recipe overhead regression tests pass; authenticated recipe save/reopen and browser work-order acceptance remain pending. Finished-product mapping, actual quantities/costs, outbox and inventory posting are still required before the complete workflow is ready.

Verification: 27 Production tests pass; client build and focused lint pass (existing bundle-size warning remains). V4 rehearsal rolled back all fixture records; development deployment applied V4 successfully. Page smoke checks returned 200 and the unauthenticated API returned 403. No authenticated browser flow is claimed as verified.

## Goal and scope

Turn saved recipes into traceable production batches: calculate requirements, record consumption and output, update stock safely, and retain historical costs. Build on [production requirements](SKILL-05-production-batch-orders.md) and the manual-cost policy in [PROGRESS.md](PROGRESS.md).

No depreciation, production-volume forecasts, automatic Finance allocation, sales orders or accounting journals in this phase. Existing data must be preserved.

## Proposed workflow and rules

- Lifecycle: **Draft → Scheduled → In progress → Completion pending → Completed**. Pending/failed inventory posting must be visible and retryable; never display Completed before inventory confirms success.
- Drafts are editable. Scheduling freezes the recipe quantities, instructions, output unit and manually entered recipe overheads; later recipe edits do not change an existing scheduled batch.
- Scale factor = planned output ÷ recipe output per batch. Scale ingredient quantities and recipe labour, energy and additional overhead by this factor. Quantities remain in each material's base UOM; eggs use pieces, not trays.
- Show availability before starting and recheck atomically when posting consumption. Initial scope has **no stock reservation**: an availability check does not guarantee stock later. A shortage blocks posting without partially changing inventory.
- Record actual ingredient consumption, good output, scrap, and actual labour/energy/overhead amounts. Prefill from the recipe but label them as defaults requiring confirmation. Require reasons for material variances; do not add recipe waste allowance again to actual consumption.
- Inventory values actual consumption at the stored material cost at posting time and saves that cost snapshot. Batch cost = consumed ingredient value + confirmed labour + energy + manual overhead + separately entered batch extras. Unit cost = batch cost ÷ good output; zero-good-output batches retain their loss cost with no division or finished-stock credit.
- Allow cancellation before production starts. Completed batches are read-only; in-progress abandonment must record consumption/loss, not silently cancel stock effects. Reversals are a later feature.

## Implementation sequence

1. [ ] **Baseline verification:** verify recipe additional-overhead save/reopen and record existing test results. Inspect actual database tables before migrations: Production V1 may have been baselined without creating batch tables.
2. [ ] **Schema and permissions:** add forward migrations for batches, frozen ingredient/cost lines, actuals, extras and transition audit; add minimal finished-product identity, output UOM and batch-linked stock records in Inventory. Reuse `VIEW_PRODUCTION`/`EXECUTE_PRODUCTION`, enforce tenant boundaries and validate recipe-to-product output-unit compatibility. Verify migrations on copied data.
3. [x] **Work order APIs:** implement list/detail/create/edit/schedule/start/cancel with server-side scaling, explicit allowed transitions and optimistic concurrency. Include schedule date, reference and notes. Unit/security tests cover unauthorized transitions, stale updates, tenant-scoped lookups, snapshot scaling and shortages; live authenticated acceptance remains pending.
4. [ ] **Inventory posting:** atomically lock materials in stable order, check availability, deduct actual quantities and credit good output. Store immutable quantity/value movements and enforce uniqueness by tenant/batch and event ID. Verify concurrent batches, shortages and repeated/conflicting requests cannot double-post or partially update stock.
5. [ ] **Reliable completion:** persist completion intent and a transactional outbox; publish through RabbitMQ with confirmations. Inventory deduplicates messages and returns a durable result with actual costs; Production marks Completed only after success. Retry infrastructure failures, surface business failures for correction, and test duplicate/out-of-order delivery and crashes. Do not rely on an in-memory event or one transaction spanning services.
6. [ ] **Production pages:** replace the placeholder with a searchable/filterable batch table, full-page create/edit form and batch detail/execution page, each with back-to-list navigation. Show planned versus actual quantities/costs, shortages, posting status and history. Match Inventory/Procurement colours; permission-based actions must also be enforced by APIs.
7. [ ] **Verification and development release:** run backend tests, client build/lint and authenticated end-to-end scenarios; back up before migration, rebuild affected services, check RabbitMQ retries and service logs, and reload Nginx if UI/gateway containers change. Update PROGRESS with evidence and remaining gaps.

## Acceptance checks

- A recipe yielding 10 units and using 5 eggs requires 10 eggs for a planned output of 20—not 10 trays.
- Actual consumption of 10 eggs from 90 leaves 80; completing/retrying the same batch again changes nothing.
- A batch with TZS 30,000 total cost, 18 good units and 2 scrap credits only 18 units; unit cost is approximately TZS 1,666.67.
- Insufficient stock changes neither ingredient nor finished stock. Duplicate delivery, concurrent posting and broker outages remain recoverable and visible.
- Recipe/material price edits do not change a completed batch's history. Purchases and expenses in Finance never automatically change batch costs.

After this phase: Orders & Sales will use recipe/batch cost snapshots plus order-specific extras such as delivery, without double-counting batch overhead. Selling-price comparison must distinguish recipe-standard costs from recorded actual costs.
