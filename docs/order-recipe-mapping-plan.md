# Order recipe mapping

Status: implemented and deployed 2026-09-23; authenticated acceptance pending. First slice of stage 3 in the order-production linkage plan.

2026-09-24: mapping moved above Payments with explicit no-payment-required guidance and regression protection; see [payment-independent preparation plan](payment-independent-production-plan.md). Payment has never been an API mapping prerequisite. Authenticated unpaid-order acceptance remains pending.

Goal: select an active recipe for an order line, explicitly state recipe-output quantity per ordered unit, and save a server-calculated standard-cost snapshot. Example: two cakes at 1 kg each require 2 kg of recipe output. This is not an automatic conversion of arbitrary sales-unit text.

- [x] Save plan and progress before coding.
- [x] Add Sales mapping migration with order-line relationship, recipe/output identifiers and labels, output-per-item factor, planned quantity and standard-cost snapshot.
- [x] Validate recipe through authenticated Production API; enforce tenant, sales/recipe permissions, editable order status and optimistic version. Reject unavailable recipes and invalid output quantities.
- [x] Add mapping dialog/table to order detail using existing colours; show unlinked items explicitly. Mapping must not create production or change inventory.
- [ ] Test calculations, stale/status guards, error handling, frontend build/lint and migrations; update progress and deployment evidence.

Scope boundary: work-order generation/retry/cancellation coordination, finished-product mapping, actual stock posting and delivery remain subsequent slices. Sales-item edits invalidate their mappings; confirmed orders may be mapped before work-order generation exists. New linkage guards must be added before generation is enabled.

Evidence: 32 Sales and 27 Production tests passed; client build/focused lint passed. Sales V4 passed rollback rehearsal and applied successfully; Sales/Production started normally. Existing order preserved, no mappings or stock mutations created by deployment. Authenticated save/reopen, cross-service error/security acceptance and browser checks remain unverified.
