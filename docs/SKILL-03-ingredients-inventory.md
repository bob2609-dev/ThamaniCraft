# SKILL-03: Raw Materials, Ingredients & Multi-Unit Inventory

**Scope:** `craft-inventory-service`  
**Core Problem Solved:** Handling bulk purchasing vs fractional kitchen consumption.  

---

## 1. Multi-Tier Units of Measure (UOM) Architecture

Food and craft production requires two distinct units:
1. **Base Consumption Unit**: The smallest unit used in recipes (e.g. `grams`, `milliliters`, `pieces`).
2. **Purchase / Storage Unit**: How suppliers deliver items (e.g. `50kg Bag`, `20L Jerrycan`, `Carton of 24`).

### Schema Definition:
```sql
CREATE TABLE units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(64) NOT NULL,           -- e.g. "Kilogram", "Gram", "Liter", "Milliliter"
    symbol VARCHAR(16) NOT NULL,         -- e.g. "kg", "g", "L", "ml"
    base_unit_id UUID REFERENCES units_of_measure(id),
    conversion_factor NUMERIC(12, 6) DEFAULT 1.0, -- e.g. 1 kg = 1000 g (conversion_factor = 1000)
    category VARCHAR(32) NOT NULL        -- "WEIGHT", "VOLUME", "COUNT"
);

CREATE TABLE raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    sku VARCHAR(64),
    name VARCHAR(255) NOT NULL,          -- e.g. "All-Purpose Wheat Flour"
    category VARCHAR(64),                -- "FLOUR", "DAIRY", "SPICES", "PACKAGING"
    base_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    purchase_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    current_stock_base_qty NUMERIC(14, 4) NOT NULL DEFAULT 0.0000, -- e.g. 125,000 grams
    cost_per_base_unit NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,     -- e.g. TZS 1.80 per gram (TZS 1,800/kg)
    reorder_level_base_qty NUMERIC(14, 4) NOT NULL DEFAULT 10000.0000,
    storage_location VARCHAR(128),       -- e.g. "Dry Store Shelf A"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Automatic Conversion on Supplier GRN (Receiving)

When a shipment arrives:
```
Shipment Received: 5 x 50kg Bags of Flour @ TZS 90,000 per bag
Total Cost = TZS 450,000
Base Quantity Credited = 5 * 50 * 1,000 = 250,000 grams
New Cost Per Base Unit (Gram) = 450,000 / 250,000 = TZS 1.80/g
```

---

## 3. Stock Adjustment & Spoilage Logging

Any non-production stock decrement (e.g. spilled flour, expired milk, damaged boxes) logs an audit entry:
```sql
CREATE TABLE inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    adjustment_type VARCHAR(32) NOT NULL, -- "SPOILAGE", "SPILLAGE", "PHYSICAL_AUDIT", "RETURN"
    quantity_base_qty NUMERIC(14, 4) NOT NULL,
    total_cost_impact NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```\n