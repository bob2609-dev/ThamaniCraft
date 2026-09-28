# Sales Order Fulfillment, Delivery & Costing Implementation Plan

Status: Implementation in progress for Stage 6 (Fulfillment & Delivery) and Stage 7 (Cost & Margin Analysis).
See [HANDOVER.md](HANDOVER.md) and [PROGRESS.md](PROGRESS.md) for master status tracking.

---

## 🎯 Plan Objective

Complete Stage 6 and Stage 7 of the Orders–Production Linkage Roadmap:
1. **Stage 6: Delivery & Fulfillment Tracking**
   - Track order delivery/collection status (`UNFULFILLED`, `FULFILLED`).
   - Idempotent stock dispatch: Deduct finished products from inventory when order items are delivered or collected.
   - Record collection/delivery timestamps, carrier/collector name, and dispatch notes.
   - Display fulfillment details and action controls in Sales Order View.

2. **Stage 7: Actual Order Costs & Profit Margin Analysis**
   - Attribute actual production batch costs (materials + scrap + labor + energy + overheads) back to order items.
   - Display real margin per order line and total order (Selling Price vs Standard Estimated Cost vs Actual Production Cost).

3. **Final End-to-End Acceptance Verification**
   - Verify full workflow: Customer -> Order -> Finished Product / Recipe Mapping -> Work Order -> Production completion -> Finished product stock posting -> Order fulfillment -> Profit margin report.

---

## 📐 Architectural & Domain Design

```
+-----------------------------------------------------------------------------------+
|                                 SALES SERVICE                                     |
|                                                                                   |
|  orders                                                                           |
|  - fulfillment_status ('UNFULFILLED', 'FULFILLED')                                 |
|  - fulfilled_at, fulfilled_by, carrier_or_collector, fulfillment_notes           |
|                                                                                   |
|  POST /api/sales/orders/{id}/fulfill  ==============================+             |
+---------------------------------------------------------------------|-------------+
                                                                      |
                                                                      | REST call
                                                                      v
+-----------------------------------------------------------------------------------+
|                                INVENTORY SERVICE                                  |
|                                                                                   |
|  POST /finished-products/{id}/dispatch                                            |
|  - Deducts current_stock_base_qty                                                 |
|  - Inserts inventory_adjustments record (type: 'FINISHED_GOODS_DISPATCH')         |
+-----------------------------------------------------------------------------------+
```

---

## 🛠️ Step-by-Step Execution Checklist

### Phase 1: Database Migrations & Entities (Sales & Inventory)
- [ ] **Sales Migration (`V7__Order_Fulfillment.sql`)**:
  - Add `fulfillment_status` VARCHAR(20) NOT NULL DEFAULT 'UNFULFILLED' CHECK (fulfillment_status IN ('UNFULFILLED','FULFILLED')).
  - Add `fulfilled_at` TIMESTAMPTZ, `fulfilled_by` UUID, `carrier_or_collector` VARCHAR(255), `fulfillment_notes` VARCHAR(1000).
- [ ] **Inventory Dispatch Endpoint / Logic (`craft-inventory-service`)**:
  - Add `POST /finished-products/{id}/dispatch` endpoint accepting quantity, order reference, and notes.
  - Atomically deduct stock (`current_stock_base_qty = current_stock_base_qty - quantity`) with `current_stock_base_qty >= quantity` guard.
  - Log `inventory_adjustments` entry with `adjustment_type = 'FINISHED_GOODS_DISPATCH'`.

### Phase 2: Sales Service Fulfillment Backend (`craft-sales-service`)
- [ ] **InventoryDispatchClient Component**:
  - Create REST client in `craft-sales-service` to invoke Inventory Service dispatch API with tenant context & JWT forward.
- [ ] **SalesService Fulfillment Method**:
  - Add `fulfillOrder(UUID orderId, FulfillmentRequest request)` method.
  - Require order to be `CONFIRMED`.
  - Check `fulfillment_status` is `UNFULFILLED` (idempotency).
  - Iterate order items with `finished_product_id`: call inventory dispatch client.
  - Update order status & audit history (`action = 'FULFILLED'`).

### Phase 3: Client UI Implementation (`thamanicraft-client-ui`)
- [ ] **Sales Order View (`Sales.jsx` / `OrderEntry.jsx`)**:
  - Display Fulfillment Status badge (`UNFULFILLED` / `FULFILLED`) and delivery/collection details.
  - Add "Mark as Delivered / Collected" action button with confirmation modal (Carrier/Collector name, notes).
  - Show finished goods stock dispatch status per item.

### Phase 4: Stage 7 — Actual Order Costing & Profit Margin Analysis
- [ ] **Order Cost Breakdown Component**:
  - Display recipe standard cost, actual batch cost (from linked work order), line-item margin, and overall order profit margin %.
  - Calculate: `Gross Profit = Total Selling Price - Delivery Charge - Actual Cost`.

### Phase 5: Verification & Documentation Update
- [ ] Build & restart services (`craft-sales-service`, `craft-inventory-service`).
- [ ] Run backend tests and frontend linting/build.
- [ ] Update `docs/HANDOVER.md` and `docs/PROGRESS.md`.
