# Product Requirements Document (PRD) — ThamaniCraft

**Product Name:** ThamaniCraft  
**Tagline:** *Crafted Precision. Automated Manufacturing.*  
**Target Market:** Small-to-Medium Manufacturing Enterprises, Bakeries, Craft Food & Beverage Producers, Commercial Kitchens, and Light Fabrication Workshops in Tanzania and East Africa.  
**Frontend Architecture:** ReactJS (Vite + React SPA) with Ant Design / Tailwind CSS.  
**Backend Architecture:** Java Spring Boot 3 microservices with PostgreSQL, Flyway, and RabbitMQ.  
**Deployment:** Docker Compose, Nginx Subdomain Routing, Timezone: `Africa/Dar_es_Salaam`.

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
Small-to-medium food and craft manufacturers in East Africa operate with fragmented, manual systems (spreadsheets or paper logbooks) to track production. Standard retail POS platforms fail because they only understand buying and selling finished goods—they cannot:
1. Track raw materials purchased in bulk (e.g. 50kg bags of flour, 20L oil drums) and consumed in fractional units (e.g. 250g, 15ml).
2. Model recipe Bill of Materials (BOM) with waste/spoilage percentages and labor/overhead costing.
3. Automatically deduct raw material stock when baking a batch or selling a finished item.
4. Provide accurate Cost of Goods Sold (COGS) and dynamic profit margin calculations based on fluctuating ingredient prices.
5. Manage wholesale B2B client ledgers, delivery notes, and bulk dispatches.

### 1.2 The ThamaniCraft Solution
ThamaniCraft is a purpose-built vertical SaaS platform that bridges the gap between **Kitchen/Workshop Production** and **Commercial Sales**:
- **Smart Ingredient Inventory**: Raw materials management with automated multi-unit conversions (kg <-> g, L <-> ml, carton <-> pcs).
- **Dynamic Recipe & BOM Engine**: Interactive recipe builder calculating accurate per-unit COGS factoring in raw ingredients, waste factors, and energy/labor overheads.
- **Batch Work Orders**: Digital production logs to schedule, track, and complete batches, automatically consuming raw materials and stocking finished goods.
- **B2B Wholesale & Counter Dispatch**: Invoicing, delivery notes, customer credit balances, and rapid order dispatch.
- **Invisible Manufacturing Accounting**: Automated double-entry cost accounting (Raw Materials -> WIP -> Finished Goods -> COGS & Revenue).

---

## 2. User Personas

| Persona | Role | Primary Goals & Daily Jobs |
| :--- | :--- | :--- |
| **Store Owner / Executive** | Business Owner | Monitor overall profitability, gross margins per product line, raw material valuation, and high-level P&L statements. |
| **Head Baker / Production Manager** | Workshop / Kitchen Lead | Schedule production batches, adjust recipe batch sizes, log waste/spoilage, monitor kitchen stock levels. |
| **Procurement Officer** | Inventory & Purchasing | Receive bulk deliveries from suppliers (GRN), verify purchase prices, manage reorder alerts for critical ingredients. |
| **Sales & Dispatch Clerk** | Wholesale / Front Counter | Create B2B orders, print delivery notes and invoices, accept payments (Cash, Mobile Money, Bank Transfer), track customer credit accounts. |

---

## 3. Core System Modules

```
[Procurement & GRN] ---> (Stocks Raw Ingredients) ---> [Raw Material Inventory]
                                                                |
                                                                v
                                                      [Recipe & BOM Engine]
                                                                |
                                                                v
                                                    [Production Batch Orders]
                                                                |
                                          +---------------------+---------------------+
                                          |                                           |
                                          v                                           v
                             (Deducts Raw Materials)                     (Outputs Finished Goods)
                                                                                      |
                                                                                      v
                                                                          [B2B Wholesale & Dispatch]
                                                                                      |
                                                                                      v
                                                                        [Manufacturing Accounting]
```

### Module 1: Raw Material Inventory & Unit Conversions
- Track raw ingredients and packaging supplies separately from finished retail goods.
- Multi-tier Units of Measure (UOM):
  - Base Unit (e.g., `gram`, `milliliter`, `piece`)
  - Purchase Unit (e.g., `50kg Bag`, `20L Jerrycan`, `Box of 100`)
  - Conversion Factors automatically applied upon receiving Goods Received Notes (GRN).
- Minimum reorder threshold alerts.

### Module 2: Recipe Builder & Bill of Materials (BOM) Engine
- Hierarchical recipe formulation linking finished products to raw ingredients.
- Dynamic attributes per recipe item:
  - Required Quantity (in base or recipe UOM)
  - Waste / Spoilage Factor (e.g., 5% trimming or baking evaporation loss)
- Real-time COGS Rollup:
  COGS = Sum(Qty * Unit Cost * (1 + Waste Factor)) + (Labor Overhead + Energy Overhead) / Batch Size
- Target Profit Margin Sandbox: Enter desired margin (e.g. 35%) -> suggested selling price computed live.

### Module 3: Production Work Orders & Batch Execution
- Create Batch Production Orders with status lifecycle:
  `DRAFT` -> `SCHEDULED` -> `IN_PROGRESS` -> `COMPLETED` / `CANCELLED`
- Auto-scaling recipes: Scale recipe up or down by batch size (e.g., 1x batch = 50 loaves, 5x batch = 250 loaves).
- Atomic transaction execution on `COMPLETED`:
  1. Atomic decrement of all constituent raw materials from stock.
  2. Increment of finished goods stock.
  3. Audit log creation for variance tracking (actual vs expected yield).

### Module 4: B2B Wholesale, Invoicing & Dispatch
- Wholesale client database with credit limits and payment terms (e.g. Net 15, Net 30).
- Order processing with custom pricing tiers.
- Printable Delivery Notes, Dispatch Slips, and Fiscal Invoices.
- Multi-tender settlement: Cash, M-Pesa, Tigo Pesa, Airtel Money, Bank Wire, or Customer Credit Ledger.

### Module 5: Manufacturing Cost Accounting & Financial Statements
- Transparent double-entry journal creation behind frontline operations.
- Real-time financial reports:
  - Profit & Loss Statement (P&L) factoring true COGS.
  - Raw Material vs Finished Goods Asset Balance Sheet.
  - Waste & Spoilage Variance Report.
  - Tanzania TRA 18% VAT Output vs Input Tax reconciliation.

---

## 4. Technical Architecture

### 4.1 Frontend Architecture (ReactJS SPA)
- **Framework:** React 18 / 19 with **Vite** build tooling.
- **Routing:** React Router v6.
- **UI Library:** Ant Design v5 + Tailwind CSS utilities.
- **State & Data Fetching:** Axios instance with JWT interceptors + React Context / Zustand.
- **Theme:** Dynamic Dark Mode & Light Mode (Deep Navy / Slate enterprise palette).
- **Charts:** Recharts for yield, revenue, and production efficiency trends.

### 4.2 Backend Architecture (Spring Boot Microservices)
- **Framework:** Spring Boot 3.x, Java 21 / 17.
- **Services:**
  1. `identity-service`: Multi-tenant auth, user management, JWT tokens, tenant provisioning.
  2. `craft-production-service`: Recipes, BOM, batch orders, COGS calculation.
  3. `craft-inventory-service`: Raw materials, finished goods, UOM conversions, GRN receiving.
  4. `craft-sales-service`: B2B wholesale orders, dispatch, delivery notes, invoicing.
  5. `craft-finance-service`: Expenses, customer credit ledger, manufacturing journals.
- **Database:** PostgreSQL with separate tenant identifier columns (`tenant_id UUID`) and Flyway migration scripts.
- **Message Broker:** RabbitMQ (`thamanicraft.direct` exchange) for asynchronous event streaming.

---

## 5. Multi-Tenancy & URL Routing Architecture

- **Subdomain Routing via Nginx**: `http://<tenant-slug>.thamanicraft.co.tz:8088`
- **Decoupled Naming**:
  - `name`: Permanent immutable routing slug (e.g. `bakery1`).
  - `display_name`: Human-readable editable business title (e.g. `SUNRISE ARTISAN BAKERY`).
- **Timezone**: Strictly configured to `Africa/Dar_es_Salaam` (UTC+3) across all services, databases, and containers.
