# Payment-independent mapping and preparation

Date: 2026-09-24. Immediate scope: mapping visibility and regression protection.

The user confirmed mapping is visible but appeared to require full payment. Inspection found no payment gate in mapping UI/API: allowed order states are NEW/CONFIRMED with Sales/Recipe permissions. Mapping was below Payments; the exact browser symptom has not been reproduced.

## Immediate work

- [x] Inspect mapping permissions, status guards and layout; save plan before changes.
- [x] Move mapping above Payments on saved order details and state explicitly that no payment/deposit is required.
- [x] Test mapping eligibility across unpaid, partially paid and paid orders; preserve cancelled/status and permission restrictions.
- [x] Build/lint/test, record evidence and update HANDOVER/PROGRESS. Sales: 38 passing tests; frontend policy test file, build and focused lint passed. Existing bundle-size warning remains. Served UI confirms the new order and message; no migration or backend runtime changes.
- [ ] Authenticated unpaid/partially paid order mapping save/reopen; policy tests do not establish browser acceptance.

## Approved direction for subsequent production work

- Payment, preparation and fulfilment are independent. Confirmed orders may generate work, consume ingredients and be fully prepared before payment; payment remains recordable later. Financial warnings must not become production gates.
- Allow recording customer cancellation even after preparation through a dedicated, authorised settlement workflow—not the current pre-production Cancel action.
- Retain actual consumption, batch costs, good output and payment history. Cancellation must not automatically restore ingredients or erase production.
- Record cancellation time, actor, reason and preparation state. For finished goods require explicit disposition: retain/reallocate available stock, or record scrap/loss; avoid double allocation or double cost posting.
- Record refund/retained-deposit/cancellation-charge decisions explicitly under an agreed settlement policy. Do not assume all deposits are refundable or use erroneous-payment reversal to represent actual money refunded.
- If work is in progress, stop remaining work safely and record actual consumption/output/loss; resolve in-flight posting before final settlement.
- Before enabling this workflow, implement production actuals, durable stock posting, output allocation and settlement decisions. Test zero/partial/full payment, partially/fully prepared cancellation, retries and stock/cost conservation.

This supersedes the earlier proposal to permanently prohibit order cancellation after production starts. A temporary safety block remains until the dedicated workflow exists. This change does not yet implement preparation, stock posting or post-preparation cancellation.
