# Post-Preparation Cancellation & Settlement Workflow

Status: Draft / In Progress
Date: 2026-09-26

## Objective
Implement a dedicated cancellation and settlement workflow for orders that are canceled *after* production (preparation) has started or completed. This ensures that physical inventory movements, production costs, and financial settlements (retained deposits vs. refunds) are recorded accurately without erasing the historical record of the work that took place.

## Core Requirements
1. **Production Abort**: Allow `IN_PROGRESS` work orders to be stopped safely. Instead of deleting the batch, the user must record actual consumption and any yield/scrap, ensuring costs and inventory are accurately deducted.
2. **Order Settlement API**: Provide an advanced cancellation endpoint on the Sales service (`/api/sales/orders/{id}/settle-cancellation`) that captures:
   - Cancellation reason.
   - Financial disposition (Amount refunded vs. Amount retained as a cancellation charge).
   - Inventory disposition for any finished goods produced for the order (Retain in stock vs. Scrap).
3. **UI Integration**:
   - Provide a "Settle & Cancel" action on the Sales Order page.
   - Enforce a validation check: If there are linked work orders still in `IN_PROGRESS` or `COMPLETION_PENDING` states, block the cancellation and instruct the user to resolve them in the Production module first.
   - Provide a modal to capture the settlement decisions.

## Implementation Steps

### Phase 1: Production Service (Safe Abort)
- Update `WorkOrderService.java` to support an `abort` transition for `IN_PROGRESS` work orders.
- This will function similarly to `complete`, transitioning the order to `COMPLETION_PENDING` (or a new `ABORT_PENDING` state) but expecting lower yields and potentially high scrap. The existing outbox pattern for `BatchCompleted` will handle the inventory deduction. (We will reuse the completion flow but allow the UI to present it as an "Abort" action with 0 yield if needed).

### Phase 2: Sales Service (Settlement API)
- Create `SettleCancellation` request record.
- Add `settleCancellation(UUID id, SalesRequests.SettleCancellation request)` to `SalesService.java`.
- Validate that the order is `CONFIRMED`.
- Create a `sales.order_settlements` table (or handle it via payment reversals and order history) to track the settlement.
- Call `InventoryDispatchClient` to scrap finished goods if the disposition requires it, OR just leave them in stock (since they are in inventory until dispatched). If they are to be scrapped, we need a new inventory API to scrap finished goods, or we just dispatch them as a write-off.

### Phase 3: Inventory Service (Write-off)
- Add a `POST /finished-products/{id}/write-off` endpoint to scrap/write-off finished goods resulting from a cancelled order.

### Phase 4: UI Changes
- In `WorkOrder.jsx`, add an "Abort batch..." button for `IN_PROGRESS` work orders.
- In `OrderEntry.jsx` / `Sales.jsx`, add the "Settle & Cancel Order" modal.

## Completion Criteria
- An order that has already generated work orders can be successfully cancelled.
- Consumed materials remain deducted from inventory.
- The retained deposit is accurately tracked in the order's financial summary.
