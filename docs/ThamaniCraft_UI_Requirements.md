# UI/UX Specifications & Screen Blueprints: ThamaniCraft SaaS

**Target Platform:** ThamaniCraft (Multi-Tenant Manufacturing ERP & Kitchen Management SaaS)  
**Frontend Stack:** ReactJS (Vite SPA) + Ant Design v5 + Tailwind CSS + Recharts  

---

## 1. Shell & Navigation Hierarchy

### 1.1 Enterprise Left Sidebar (Fixed 260px)
- **Brand Header:** ThamaniCraft Logo + Tagline *"Crafted Precision"*
- **Menu Hierarchy:**
  1. **Dashboard** (`/`): Executive overview of production, stock value, and daily yield.
  2. **Batch Work Orders** (`/production/batches`): Live kitchen kanban / queue for scheduled and active batches.
  3. **Recipe & BOM Builder** (`/recipes`): Recipe library, ingredient breakdowns, and live COGS calculator.
  4. **Raw Material Stock** (`/inventory/raw-materials`): Bulk ingredients, packaging, UOM conversions, and reorder levels.
  5. **Finished Goods** (`/inventory/finished-goods`): Packaged output ready for dispatch or retail counter.
  6. **Procurement & GRN** (`/purchases`): Supplier purchase orders and goods receiving.
  7. **B2B Wholesale & Dispatch** (`/wholesale`): Client orders, delivery notes, and dispatches.
  8. **Suppliers** (`/suppliers`): Vendor contact records, lead times, and price sheets.
  9. **Clients (CRM)** (`/clients`): Wholesale customer accounts, credit balances, and price tiers.
  10. **Manufacturing Reports** (`/reports`): Batch yield efficiency, scrap analysis, and P&L.
  11. **Cost Accounting** (`/accounting`): Automated WIP and manufacturing journal entries.
  12. **Settings** (`/settings`): Store display name, units of measure catalog, roles & permissions.
- **Sidebar Footer:** Active Outlet / Bakery Station Switcher (`Bakery Station 1 - Change Station`).

---

## 2. Key Screen Blueprints

### Screen 1: Interactive Recipe Builder & COGS Simulator (`/recipes/[id]`)
- **Header:** Recipe Name (e.g. *Brioche Bread 500g*), Standard Batch Size (e.g. *40 Loaves*), Total Batch Cost, Unit COGS.
- **Dynamic Ingredient Table:**
  - Columns: Ingredient Name, Base Qty, UOM, Unit Cost (TZS), Waste Factor %, Line Cost (TZS), Actions.
  - Inline editing with live debounced recalculation.
- **Overhead Costing Strip:**
  - Labor cost per batch (e.g. `TZS 12,000`).
  - Energy/Oven power per batch (e.g. `TZS 8,000`).
- **Live Margin Sandbox Panel (Right 340px):**
  - **Target Margin Slider:** (e.g. `35%`).
  - **Computed Suggested Retail Price:** (e.g. `TZS 2,800`).
  - **Current Selling Price:** (e.g. `TZS 3,000` -> `Realized Margin: 39.3%`).
  - `Apply Price to Catalog` button.

---

### Screen 2: Kitchen Display System (KDS) & Batch Work Orders (`/production/batches`)
- **Visual Kanban Board:**
  - Column 1: `Scheduled` (Queued batches for today).
  - Column 2: `Mixing / Prep` (Raw ingredients measured and mixed).
  - Column 3: `Baking / In-Process` (Oven or production line active).
  - Column 4: `Quality Check & Packaging` (Yield counting and scrap audit).
  - Column 5: `Completed / Restocked` (Finished goods credited).
- **Batch Card Details:**
  - Product Name, Target Batch Qty (e.g. `100 Loaves`).
  - Allocated Baker / Operator.
  - Start Time & Elapsed Timer.
  - 1-Click Action: `Complete Batch` -> prompts: *Good Output Qty (e.g. 98)* and *Scrap Qty (e.g. 2)*.
- **Print Action:** `Print Batch Kitchen Ticket` (80mm thermal ticket with ingredient checklist).

---

### Screen 3: Raw Materials & Multi-UOM Inventory (`/inventory/raw-materials`)
- **Top 5 KPI Metrics:**
  1. Total Raw Materials Tracked.
  2. Total Stock Valuation (TZS).
  3. Items Below Reorder Point.
  4. Pending Inbound Supplier Deliveries.
  5. Month-to-Date Spoilage / Scrap Value.
- **Data Table:**
  - Columns: Ingredient Name, Category, Stock in Base UOM (e.g. `150,000 g`), Stock in Purchase UOM (e.g. `3 x 50kg Bags`), Unit Cost, Asset Value (TZS), Reorder Status, Actions.
- **Quick Action Modals:**
  - `Receive GRN` (Converts supplier bags/cartons into base grams/ml).
  - `Log Spoilage / Spillage` (Deducts stock with reason code and cost impact).

---

### Screen 4: B2B Wholesale Order & Delivery Note Terminal (`/wholesale`)
- **Order Form:** Client selection, delivery address, custom wholesale pricing tier.
- **Order Line Items:** Finished goods selection with live available stock checks.
- **Printable Documents:**
  - **Delivery Note**: Formal dispatch document with delivery driver signature and receiving clerk stamp box.
  - **Wholesale Tax Invoice**: Compliant with Tanzania 18% VAT and TRA EFDMS regulations.

---

### Screen 5: Manufacturing Reports & Yield Analytics (`/reports/production`)
- **Charts:**
  - **Yield Efficiency Trend:** Line chart plotting daily actual vs expected yield %.
  - **Ingredient Cost Variance:** Bar chart showing raw material price fluctuations.
  - **Scrap & Waste Breakdown:** Donut chart categorizing scrap reasons (Burnt, Dough Dropped, Quality Defect).\n