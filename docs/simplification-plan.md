# ThamaniCraft: UX Simplification Detailed Implementation Plan

## Executive Summary
This document provides the detailed technical roadmap for pivoting the ThamaniCraft UI from a complex manufacturing ERP into a simplified, Point-of-Sale (POS) and streamlined action-based system, while retaining the robust microservice architecture underneath.

---

## Phase 1: Core Utilities & Database Extensions
*Goal: Remove the math burden from the user by introducing automatic culinary conversions and recipe modes.*

### 1.1. `craft-inventory-service`: Smart UOM Dictionary
*   **Action**: Create a `SmartUOMConverter` utility class.
*   **Details**: Define standard volumetric (Liters, ml, Cups, Tbsp, Tsp) and weight (Kg, g, oz, lbs) constants.
*   **Preset Support**: Support custom preset multipliers (e.g., `TRAY_OF_EGGS = 30`).

### 1.2. `craft-production-service`: Recipe Mode Database Migration
*   **Action**: Create Flyway migration (e.g., `V10__Recipe_Production_Mode.sql`).
*   **Details**: Add `production_mode` enum (`BATCH_PRE_MADE`, `JUST_IN_TIME`) to the `recipes` table. Default to `BATCH_PRE_MADE`.

### 1.3. `craft-production-service`: Smart Recipe Costing
*   **Action**: Update `RecipeService` cost calculation logic.
*   **Details**: Instead of relying on user-provided conversion factors between "Purchase Units" and "Recipe Units", intercept the calculation and route it through the `SmartUOMConverter`.
*   **Validation**: Add Unit Tests verifying that a recipe asking for 1 Cup of Milk correctly costs out against a 2 Liter raw material purchase.

---

## Phase 2: Backend Facade APIs (Composite Actions)
*Goal: Wrap complex multi-step ERP operations (like drafting/confirming/mapping/dispatching) into single, atomic REST endpoints.*

### 2.1. `craft-sales-service`: POS Checkout API
*   **Endpoint**: `POST /api/sales/pos/checkout`
*   **Payload**: `{ customerId (optional), items: [{productId, quantity}], paymentAmount, paymentMethod }`
*   **Internal Sequence**:
    1. Create Order & Confirm immediately.
    2. Map items to recipes.
    3. Register Payment receipt.
    4. Trigger Fulfillment: If item is `JUST_IN_TIME`, emit event to instantly deduct raw materials. If `BATCH_PRE_MADE`, emit event to dispatch finished goods.
    5. *(All wrapped in a transaction).*

### 2.2. `craft-inventory-service`: Quick Refill API
*   **Endpoint**: `POST /api/inventory/raw-materials/{id}/refill`
*   **Payload**: `{ boughtQuantity, unit (e.g. Liters), totalCost }`
*   **Internal Sequence**: Auto-generates a Goods Receipt Note (GRN) and recalculates the weighted-average cost. Dispatches a `StockRefilledEvent` to the Finance service to log an expense.

### 2.3. `craft-production-service`: Quick Make API
*   **Endpoint**: `POST /api/production/quick-make`
*   **Payload**: `{ recipeId, quantity }`
*   **Internal Sequence**: Skips the UI lifecycle. Immediately creates a Work Order, sets status to `COMPLETED`, deducts raw materials, and credits finished goods inventory.

### 2.4. `craft-finance-service`: Quick Expense API
*   **Endpoint**: `POST /api/finance/quick-expense`
*   **Payload**: `{ category, description, amount, date }`
*   **Internal Sequence**: Generates a standard Journal Entry logging a cash outflow against an operational expense account.

---

## Phase 3: Frontend UI Redesign - Dashboard & Sales (POS)
*Goal: Replace data-heavy tables with touch-friendly, action-oriented interfaces.*

### 3.1. Dashboard Restructuring
*   **Component**: `Dashboard.jsx`
*   **Changes**: Remove the dense analytical charts. Build 4 primary action cards covering 80% of screen space (`[ + New Sale ]`, `[ + Buy Stock ]`, `[ + Record Expense ]`, `[ 🧑‍🍳 Make Product ]`). 
*   **Metrics**: Keep a thin top banner with "Today's Sales", "Profit Today", and a "Low Stock Alerts" ticker.

### 3.2. POS Interface (Replaces OrderEntry)
*   **Component**: `OrderEntry.jsx` -> `PointOfSale.jsx`
*   **Changes**: Implement a classic POS view.
    *   *Left Pane*: Visual grid of finished goods/menu items.
    *   *Right Pane*: The Cart, showing running total.
    *   *Checkout Modal*: Click Checkout, type cash received, calculates change, and hits the new `POST /pos/checkout` facade API.

---

## Phase 4: Frontend UI Redesign - Inventory & Production
*Goal: Hide accounting and industrial manufacturing jargon.*

### 4.1. "Refill Stock" Flow
*   **Component**: `Inventory.jsx` -> `RefillModal.jsx`
*   **Changes**: Replace the complex GRN receipt table with a simple modal: "What did you buy? How much? What was the total price?" Calls the `refill` facade API.

### 4.2. Recipe Builder Simplification
*   **Component**: `RecipeEditor.jsx`
*   **Changes**: Remove inputs for Labor, Energy, Manual Overheads, and Waste %. Add a toggle for "Pre-Made" vs "Made-on-Demand". Simplify the ingredient picker to utilize the Smart UOM dropdowns (Cups, Liters, etc.).

### 4.3. "Make Product" Flow
*   **Component**: `WorkOrder.jsx` (Deprecated) -> `QuickMakeModal.jsx`
*   **Changes**: Remove the Draft/Scheduled/In Progress lifecycle UI. Replace with a single modal: Select Product -> Enter Quantity -> Click "Produce".

---

## Phase 5: Frontend UI Redesign - Finance & Reporting
*Goal: Translate double-entry ledgers into simple Cash Flow.*

### 5.1. Expense Recording
*   **Component**: `Assets.jsx` -> `Expenses.jsx`
*   **Changes**: A simple list of operational expenses with a "Record Expense" button calling the `quick-expense` facade.

### 5.2. Simple P&L Report
*   **Component**: `Reports.jsx`
*   **Changes**: Hide the Trial Balance and Journal Entries tabs. Replace with a "Money In / Money Out" view (Sales Revenue minus Ingredient Costs & Expenses).

---

## Phase 6: Global Design & UX Principles
*Goal: Ensure the application feels smooth, premium, and easy to use across all screens.*

### 6.1. Visual Language
*   **Modern & Simple**: Maintain a clean, minimalist layout. Prioritize readability and space.
*   **Restrained Styling**: Avoid overusing gradients. Prefer flat or slightly elevated solid colors with subtle shadows for depth.

### 6.2. Interaction & Feedback
*   **Animations**: Liberally use meaningful micro-animations (e.g., transitions, hover states, loaders) to make the UI feel alive and responsive.
*   **Active Notifications**: Every CRUD action (create, update, delete) or background process must proactively inform the user of its progress, successful completion, or failure. Use clear, on-screen messages (toasts, alerts, or modal animations).
*   **Sortable Data**: Any remaining tables or list views MUST have clickable headers to sort the data dynamically.
