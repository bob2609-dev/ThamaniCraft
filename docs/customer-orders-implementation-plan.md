# Customer Orders — Implementation Plan

Status: intake implementation in progress, 2026-09-23.

Remaining work is sequenced in the [Orders–Production linkage plan](order-production-linkage-plan.md), including payments, safe completion, finished-output allocation and dispatch. Implementation is approved and stage 1 is in progress; detailed rules below remain applicable.

## Current delivery

Implemented customer create/list/edit APIs and Customers maintenance page; order create/list/detail APIs and full-page entry/detail screens. Name and phone are the only required customer details. Add customer opens a compact modal inside the order form, preserves entered order fields and selects the saved customer. Email, address and notes can be completed later in Customers. Saving the customer is independent of submitting the order.

Order intake includes items/instructions, due time, collection/delivery, delivery address/charge, upfront fixed discount, agreed deposit and booking-time customer contact snapshots. The list is due-date ordered and searchable. Server recalculates totals and validates the deposit against the discounted total. A submission key prevents duplicate orders; duplicates return a conflict directing the user to the list.

Lifecycle follow-up deployed 2026-09-23: new-order editing, confirmation/cancellation, readable numbers, version checks, discount/status audit and open/status/overdue filters. Sales V2 migration succeeded after backup and rollback rehearsal; existing order retained. Authenticated browser acceptance remains pending. Confirmed orders remain read-only; booked customer snapshots cannot be reassigned.

Not yet implemented: payment receipts/reversals and balances, date-range/payment filters, recipe mapping, production linkage and actual order costs. The agreed deposit is explicitly not a payment. Checklist items below remain open until their full scope and verification are complete.

Verification: 10 Sales tests, frontend build and focused lint passed. Sales V1 migration rehearsed in a rolled-back schema, then deployed successfully; gateways updated and Nginx reloaded. Authenticated browser acceptance remains pending.

## Goal

Receive and track customer orders from enquiry through collection/delivery, with clear due dates, payment history and linked production. This extends the wholesale direction in [SKILL-06](SKILL-06-b2b-wholesale-sales.md); fiscal invoicing, credit accounts and automated accounting are outside this first release.

## Order details

- **Customer:** select an existing customer or create one inline with only name and phone required. Save and select the new customer without losing order entries. Maintain optional email/address/notes later from Customers. Preserve contact/address details on the order so later customer edits do not rewrite historical orders.
- **Items:** description, optional product/recipe link, quantity, unit, agreed unit selling price and special instructions (for example cake size, flavour and message). An unlinked custom item can be recorded, but needs a recipe/output-unit mapping before generating production.
- **Fulfilment:** due date and time, collection or delivery, delivery address when applicable, and customer-facing delivery charge. Display local time in Africa/Dar_es_Salaam; store an unambiguous timestamp.
- **Commercial details:** order number, item subtotal, delivery charge, fixed order-level discount amount in TZS (not a percentage), total after discount, agreed deposit amount (optional), notes, creator and timestamps. No automatic tax assumptions in this release.
- **Upfront negotiation:** the New order form includes an editable Discount amount (TZS) field, defaulting to zero, beside the totals. Staff can record the agreed discount immediately, before saving or receiving a deposit; it is not restricted to a later edit or payment screen. Show the discount separately on the order detail and support an optional negotiation/discount note.
- **Payments:** each receipt records amount, date, method (cash/mobile money/bank/other), reference and recorder. Show total received, deposit progress and outstanding balance—not merely a deposit checkbox.

## Workflow and proposed first-release rules

**New → Confirmed → In production → Ready → Delivered / Collected**, with Cancelled as a separate terminal state.

Keep payment status separate from fulfilment status: an order can be confirmed but only partly paid. Proposed default: show unpaid/deposit warnings without automatically blocking confirmation; any strict deposit or settlement gate needs an explicit business rule.

Order total = item subtotal + delivery charge − discount amount.
Balance = order total − net recorded payments. Validate monetary amounts using decimal arithmetic: discount must be nonnegative, use at most two decimal places and not exceed subtotal plus delivery charge. The agreed deposit must not exceed the discounted total. Recalculate totals in both the form and server; never trust a client-submitted total.

Prevent duplicate payment submissions and overpayments in the first version. Never silently edit/delete payment history: corrections use authorised, reasoned reversal records. Cancellation does not erase payments or automatically issue a refund; show any refund due explicitly. Block total reductions (including increased discounts) below net payments until a supported correction/refund is recorded. Audit later discount changes with actor, timestamp and old/new amounts. Discounts reduce selling revenue, not ingredient quantities or production costs.

The list defaults to open orders by earliest due date, highlights overdue orders, and supports search by order number/customer/phone plus status, due-date and payment filters. Delivered, collected and cancelled orders remain searchable in history.

## Implementation sequence

1. [ ] **Data and permissions:** inspect the current sales/customer scaffolding, then add tenant-scoped order headers/items, customer records and contact snapshots, payments/reversals and status audit using forward migrations. Reuse VIEW_SALES/PROCESS_SALES where appropriate; protect payment recording/correction separately. Verify tenant isolation and migration preservation.
2. [ ] **Order APIs:** create/read/edit/list/confirm/cancel with server-side discounted totals, fixed-discount storage/validation, quantity/unit validation, optimistic concurrency and audit. Verify multiple items, delivery requirements, due timestamps, discount limits and stale edits.
3. [ ] **Payment APIs:** append receipts and authorised corrections with idempotency keys and transactional balance checks. Verify partial deposits, repeat submissions, concurrent receipts, overpayment rejection and cancellation/refund balances.
4. [ ] **Order screens:** build the due-date-sorted order table, full-page new/edit form and detail page with customer information, items, fulfilment, upfront fixed-discount entry, live totals, payments and history. Use a compact Record payment modal and the existing Inventory/Procurement colours. Verify validation, permissions, mobile layout and back-to-list navigation.
5. [ ] **Production linkage:** from a confirmed order, explicitly generate linked work orders per recipe-backed line. Persist order/line IDs and prevent duplicate generation on retries. Show linked batch statuses; do not infer readiness until required good output is available. Block incompatible order edits/cancellation after production starts rather than silently changing batches.
6. [ ] **Order costing:** retain recipe-standard cost snapshots separately from later actual batch costs; record order-specific extras such as actual delivery expense. Keep customer delivery charge (revenue) distinct from delivery expense (cost), avoid double-counting recipe overhead, and label planned versus actual margin clearly.
7. [ ] **Verification and release:** run backend/concurrency tests, UI build/lint and authenticated browser workflows; rehearse migrations, back up and deploy, then record evidence in PROGRESS. Coordinate actual-cost and fulfilment tests with completed inventory posting from the Production plan.

## Acceptance examples

- While creating an order, items of TZS 100,000 + delivery 5,000 − negotiated discount 10,000 produce a total of 95,000. After receiving 30,000, balance is 65,000. Save/reopen preserves the discount and breakdown.
- Reject negative/excessive discounts and later discounts that would reduce the total below payments received. Zero discount preserves the original total; a fully discounted order has zero balance and accepts no positive payment.

- An order totalling TZS 100,000 with an agreed deposit of 30,000 and a receipt of 20,000 shows deposit shortfall 10,000 and balance 80,000. A later receipt of 80,000 settles it; retrying either request does not add another payment.
- An overdue, unfulfilled order appears in the overdue filter; a collected order does not.
- Repeating Generate production produces no duplicate work orders. Order intake and payments alone never deduct ingredients or credit finished goods.
- Changing customer details, recipe prices or inventory costs does not rewrite saved order contacts, agreed selling prices or historical cost snapshots.

Delivery order: first order intake + payments; then link confirmed orders to Production while completing safe batch posting. Automatic reminders, payment-provider integration, partial deliveries, wholesale credit limits and fiscal documents are later scope.
