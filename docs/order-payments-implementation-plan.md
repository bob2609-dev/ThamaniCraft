# Order Payments — Implementation Plan

Status: in progress, 2026-09-23. Implements stage 2 of the [linkage plan](order-production-linkage-plan.md).

## Scope

Manually record actual receipts against an order: positive TZS amount, received date/time, method (cash/mobile money/bank/other), reference and recorder. Agreed deposit is a target, not money received. Payments do not confirm orders, start production or change inventory.

Corrections append a reasoned full reversal without deleting the receipt. This corrects erroneous records only, not a cash refund. Cancelled orders retain payments and show refund due; actual refunds remain deferred. No positive receipts against cancelled orders or overpayments. Payment status is independent of order status.

## Tasks

1. [x] Save this plan and mark work in PROGRESS before implementation.
2. [ ] Add forward Sales payment/reversal migration and separate RECORD_PAYMENTS / REVERSE_PAYMENTS Identity permissions; preserve existing data.
3. [ ] Implement tenant-scoped receipts/reversals under an order row lock, unique submission keys, replay checks, positive-amount validation and immutable history. Prevent edits reducing order total below net paid.
4. [ ] Expose net paid, balance, deposit shortfall and cancelled-order refund due in detail/list. Verify 67,500 total less 40,000 received leaves 27,500; distinguish zero-total settled orders.
5. [ ] Add Record payment and correction dialogs, receipt history and list payment filters, retaining existing colours. Keep submission keys stable on uncertain failures and show errors without discarding entered values.
6. [ ] Verify backend/security tests, frontend build/lint, real PostgreSQL migration/transaction/concurrency scenarios and authenticated browser workflows. Back up, deploy Sales/Identity, verify migrations and update progress with actual evidence.

Done when receipts survive reload, retries never double-count, concurrent receipts cannot overpay, corrections remain traceable, tenant/permission checks hold and deployment/browser acceptance is recorded. Until then report source, automated verification and deployment status separately.
