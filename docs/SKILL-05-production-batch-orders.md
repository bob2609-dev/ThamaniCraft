# SKILL-05: Production Work Orders & Batch Execution

**Scope:** `craft-production-service` & RabbitMQ Event Flow  

---

## 1. Batch Execution Lifecycle

```
[DRAFT] --> (Confirm Schedule) --> [SCHEDULED] --> (Start Mixing/Baking) --> [IN_PROGRESS]
                                                                                   |
                                                +----------------------------------+
                                                |
                                                v (Record Output & Scrap)
                                           [COMPLETED]
                                                |
                       +------------------------+------------------------+
                       v                                                 v
           Atomic Raw Material Deduction                     Finished Goods Credited
```

---

## 2. Event-Driven Inventory Deduction via RabbitMQ

When a Production Batch transitions to `COMPLETED`:

```json
// Event: ProductionBatchCompletedEvent
{
  "eventId": "uuid",
  "tenantId": "uuid",
  "batchId": "uuid",
  "recipeId": "uuid",
  "finishedProductId": "uuid",
  "actualYieldQuantity": 48.00,
  "expectedYieldQuantity": 50.00,
  "consumedIngredients": [
    { "rawMaterialId": "uuid-flour", "quantityDeducted": 25000.00 },
    { "rawMaterialId": "uuid-sugar", "quantityDeducted": 2000.00 }
  ],
  "totalBatchCost": 91000.00,
  "unitCost": 1895.83,
  "completedAt": "2026-09-12T22:00:00Z"
}
```

---

## 3. Yield Variance & Scrap Tracking

If a batch was planned for 50 loaves but only 48 loaves passed quality check:
- **Planned Yield**: 50 Loaves
- **Actual Good Yield**: 48 Loaves
- **Scrap / Defect Count**: 2 Loaves (Burnt / Damaged)
- **Yield Efficiency**: $(48 / 50) \times 100 = 96.0\%$
- Actual Unit Cost automatically recalculates to reflect scrap loss!\n