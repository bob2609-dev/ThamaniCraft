# SKILL-04: Recipe & Bill of Materials (BOM) Engine

**Scope:** `craft-production-service`  
**Core Objective:** Automated COGS Calculation, Waste Factor Handling & Target Margin Pricing  

---

## 1. Recipe Formulation Model

A recipe defines the exact composition of a finished product or sub-assembly:

```sql
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,             -- e.g. "Standard Sliced White Bread (800g)"
    description TEXT,
    yield_quantity NUMERIC(10, 2) NOT NULL, -- e.g. 50 (Loaves per standard batch)
    yield_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    labor_cost_per_batch NUMERIC(12, 2) DEFAULT 0.00,  -- e.g. TZS 15,000 baker labor
    energy_cost_per_batch NUMERIC(12, 2) DEFAULT 0.00, -- e.g. TZS 10,000 oven electricity
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    quantity_required NUMERIC(14, 4) NOT NULL, -- In base unit (e.g. 25,000 grams flour)
    waste_factor NUMERIC(6, 4) DEFAULT 0.0000, -- e.g. 0.05 (5% dough trimming or evaporation loss)
    instructions VARCHAR(255)                  -- e.g. "Sift before mixing"
);
```

---

## 2. COGS & Margin Calculation Formula

$$\text{Ingredient Line Cost} = \text{Quantity Required} \times \text{Raw Material Unit Cost} \times (1 + \text{Waste Factor})$$

$$\text{Total Raw Material Cost} = \sum (\text{Ingredient Line Cost})$$

$$\text{Batch COGS} = \text{Total Raw Material Cost} + \text{Labor Overhead} + \text{Energy Overhead}$$

$$\text{Unit COGS} = \frac{\text{Batch COGS}}{\text{Yield Quantity}}$$

$$\text{Suggested Selling Price} = \frac{\text{Unit COGS}}{1 - \text{Target Margin Percentage}}$$

### Example Calculation:
* Flour (25,000g @ TZS 1.80/g, 2% waste) = `25000 * 1.80 * 1.02` = **TZS 45,900**
* Sugar (2,000g @ TZS 3.20/g, 0% waste) = `2000 * 3.20` = **TZS 6,400**
* Yeast (500g @ TZS 12.00/g, 0% waste) = `500 * 12.00` = **TZS 6,000**
* Butter & Water = **TZS 7,700**
* **Total Ingredients** = TZS 66,000
* **Overheads** = TZS 25,000 (Labor + Oven Power)
* **Total Batch Cost (50 Loaves)** = TZS 91,000
* **Unit COGS (Cost per Loaf)** = `91,000 / 50` = **TZS 1,820**
* **Target Margin (35%) Selling Price** = `1,820 / (1 - 0.35)` = **TZS 2,800**

---

## 3. Real-Time COGS Sandbox (React UI)

The frontend provides an interactive simulator where changing ingredient costs or batch sizes dynamically recalibrates margins in real time without saving until confirmed.\n