# SKILL-09: Capital Investments, Machinery & Overhead Amortization

**Scope:** `craft-finance-service` & `craft-production-service`  
**License Tier:** Optional / Toggleable Module (*CapEx & Fixed Assets*)  

---

## 1. Business Problem & Objective

In food production and craft workshops, raw ingredients are only half the cost story. Significant capital is locked in:
1. **Major Production Machinery**: Industrial Ovens, Spiral Dough Mixers, Commercial Provers, Packaging Sealers.
2. **Operational Hardware & Tools**: Thermal Label Printers, Heavy-Duty Scales, Trays, Stainless Steel Worktables, Refrigeration.
3. **Leaseholds & Facilities**: Kitchen Rent, Factory Renovation, 3-Phase Electricity Upgrades, Borehole Installation.

### The Problem:
If a bakery only calculates flour and sugar in their bread costing, they risk underpricing because they fail to recoup the **TZS 25,000,000 invested in kitchen equipment and facility rent**.

### The Solution:
ThamaniCraft provides an optional **Capital Investments & Asset Ledger** that:
- Tracks all equipment, machinery, tools, and leases.
- Computes automated monthly straight-line depreciation.
- Feeds an **Asset Amortization Rate** directly into the **Recipe BOM COGS Engine**, ensuring machine wear-and-tear and rent are factored into product prices!
- Provides an executive **ROI & Break-Even Tracker** (e.g. *"This TZS 12M oven has paid off 68% of its cost through 45,000 baked loaves"*).

---

## 2. Domain & Database Schema

```sql
CREATE TABLE fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    asset_name VARCHAR(255) NOT NULL,            -- e.g. "Rotary Rack Oven 32-Tray"
    category VARCHAR(64) NOT NULL,               -- "MACHINERY", "TOOLS", "FACILITY_RENT", "IT_HARDWARE", "VEHICLE"
    serial_number VARCHAR(128),
    supplier_vendor VARCHAR(255),
    purchase_date DATE NOT NULL,
    purchase_cost NUMERIC(14, 2) NOT NULL,       -- e.g. TZS 18,500,000
    salvage_value NUMERIC(14, 2) DEFAULT 0.00,   -- Expected resale/scrap value at end of life
    useful_life_months INT NOT NULL,             -- e.g. 60 (5 years)
    depreciation_method VARCHAR(32) DEFAULT 'STRAIGHT_LINE',
    monthly_depreciation NUMERIC(12, 2) NOT NULL,-- (purchase_cost - salvage_value) / useful_life_months
    accumulated_depreciation NUMERIC(14, 2) DEFAULT 0.00,
    current_book_value NUMERIC(14, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE',         -- "ACTIVE", "MAINTENANCE", "DISPOSED", "WRITTEN_OFF"
    allocation_type VARCHAR(32) DEFAULT 'DIRECT_PRODUCTION', -- "DIRECT_PRODUCTION", "GENERAL_OVERHEAD"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facility_leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lease_title VARCHAR(255) NOT NULL,           -- e.g. "Main Kitchen & Bakery Facility Rent"
    landlord_name VARCHAR(255),
    contact_phone VARCHAR(64),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_lease_amount NUMERIC(14, 2) NOT NULL,  -- e.g. TZS 14,400,000 (1 Year advance)
    billing_period_months INT NOT NULL,          -- e.g. 12
    monthly_rent_cost NUMERIC(12, 2) NOT NULL,   -- TZS 1,200,000 / month
    payment_status VARCHAR(32) DEFAULT 'PAID',   -- "PAID", "PARTIAL", "DUE"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Feeding Machinery & Rent into the Recipe COGS Engine

The recipe engine can automatically pull an allocated **Machinery & Overhead Recovery Fee**:

$$\text{Monthly Production Overhead} = \sum (\text{Machinery Monthly Depreciation}) + \sum (\text{Monthly Facility Rent})$$

$$\text{Overhead Cost Per Batch} = \frac{\text{Monthly Production Overhead}}{\text{Estimated Monthly Batch Volume}}$$

### Example:
* Monthly Oven & Mixer Depreciation = **TZS 450,000**
* Monthly Bakery Kitchen Rent = **TZS 1,200,000**
* Total Monthly CapEx/Rent Overhead = **TZS 1,650,000**
* Estimated Production: **300 Batches / Month** (10 batches/day)
* **Overhead Recovery Per Batch** = `1,650,000 / 300` = **TZS 5,500 / batch**
* If a batch yields 50 loaves, the machine & facility recovery is **TZS 110 per loaf**!

---

## 4. UI / UX Blueprints (`/investments` or `/assets`)

1. **Executive Asset Summary Ribbon (4 Metric Cards)**:
   - **Total Capital Invested:** `TZS 45,800,000`
   - **Current Net Asset Value (Book Value):** `TZS 38,250,000`
   - **Monthly Amortization / Depreciation:** `TZS 1,650,000 / mo`
   - **Active Leases & Rent Covered:** `12 Months Active`
2. **Fixed Assets & Equipment Register Table**:
   - Columns: Asset Name, Category Tag, Purchase Date, Initial Cost, Useful Life, Accumulated Depreciation, Net Book Value, Status, Actions (`Maintenance Log`, `Depreciation Schedule`).
3. **Lease & Rent Schedule Tab**:
   - Visual timeline showing active lease periods, payment milestones, and next renewal alert.
4. **ROI & Equipment Payback Calculator**:
   - Select machine (e.g. *Rotary Oven*) -> displays revenue generated by products baked in this oven vs initial machine cost.\n