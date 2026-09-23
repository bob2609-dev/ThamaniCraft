# Goods Received Notes

## Goal

Receive supplier-delivered raw materials in purchase units, convert them to base stock, and retain an immutable receipt record.

## Tasks

- [ ] Add Flyway tables for receipt headers and lines → migration validates on startup.
- [ ] Add GRN entities, request DTOs, tenant-scoped service, and REST endpoints → receipt creation updates stock atomically.
- [ ] Add conversion, weighted-average costing, and input validation → API rejects invalid quantities, costs, and cross-tenant IDs.
- [ ] Add Procurement receipt form and receipt history → users can create and inspect GRNs.
- [ ] Verify with Maven tests/build and authenticated API calls → receipt returns 201 and inventory quantities/cost update.

## Done When

- [ ] A procurement user can receive material in purchase UOM and see updated base stock and average cost.
- [ ] Receipt history records supplier reference, receiver, time, quantities, and cost.
