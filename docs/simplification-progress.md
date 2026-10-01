# ThamaniCraft: UX Simplification Progress Tracker

*Use this tracker to monitor the implementation of `simplification-plan.md`.*

## Phase 1: Core Utilities & Database Extensions
- [x] **Backend (Inventory)**: Create `SmartUOMConverter` utility class with Volumetric & Weight constants.
- [x] **Backend (Production)**: Create Flyway migration `V10__Recipe_Production_Mode.sql` for `BATCH_PRE_MADE` and `JUST_IN_TIME`.
- [x] **Backend (Production)**: Update `RecipeService` to use `SmartUOMConverter` for unit costing.
- [x] **Testing**: Write unit tests verifying that 1 Cup correctly costs against a 2 Liter raw material purchase.

## Phase 2: Backend Facade APIs (Composite Actions)
- [x] **Backend (Sales)**: Implement `POST /api/sales/pos/checkout` (Auto-confirm, auto-map, auto-pay, auto-dispatch).
- [x] **Backend (Inventory)**: Implement `POST /api/inventory/goods-receipts/quick-refill` (Auto-GRN, emits expense event).
- [x] **Backend (Production)**: Implement `POST /api/production/work-orders/quick-make` (Auto-work-order lifecycle, deducts/credits).
- [x] **Backend (Finance)**: Implement `POST /api/finance/quick-expense` (Auto-journal entry).
- [x] **Testing**: Verify integration and atomicity (rollback on failure) for all 4 facade APIs.

## Phase 3: Frontend UI Redesign - Dashboard & Sales (POS)
- [x] **UI (Dashboard)**: Replace complex charts with 4 primary Quick Action buttons.
- [x] **UI (Dashboard)**: Implement simple top banner metrics (Today's Sales, Profit, Low Stock Alerts).
- [x] **UI (Sales)**: Build the `PointOfSale.jsx` visual grid of products.
- [x] **UI (Sales)**: Build the Cart pane and Checkout modal.
- [x] **Integration**: Wire Checkout modal to the `POST /api/sales/pos/checkout` facade.

## Phase 4: Frontend UI Redesign - Inventory & Production
- [x] **UI (Inventory)**: Replace GRN forms with a simple `RefillModal.jsx`.
- [x] **Integration**: Wire Refill modal to `POST /api/inventory/raw-materials/{id}/refill`.
- [x] **UI (Recipes)**: Remove Labor/Energy/Waste inputs from `RecipeEditor.jsx`.
- [x] **UI (Recipes)**: Add "Pre-Made" vs "Made-on-Demand" toggle.
- [x] **UI (Recipes)**: Update ingredient picker to use Smart UOM dropdowns.
- [x] **UI (Recipes)**: Simplify the Recipe page (list/table with a modal for add/edit/remove ingredient).
- [x] **Backend (Inventory)**: Seed global standard measurements and enforce tenant edits isolation.
- [x] **UI (Production)**: Deprecate `WorkOrder.jsx` lifecycle screens.
- [x] **UI (Production)**: Build `QuickMakeModal.jsx` and wire to `POST /api/production/quick-make`.

## Phase 5: Frontend UI Redesign - Finance & Reporting
- [x] **UI (Finance)**: Build simple `Expenses.jsx` replacing `Assets.jsx` / manual ledger UI.
- [x] **Integration**: Wire Expense form to `POST /api/finance/quick-expense`.
- [x] **UI (Reports)**: Hide Trial Balance and Journal Entries tabs.
- [x] **UI (Reports)**: Build the simple Profit & Loss / Cash Flow view.

## Phase 6: Global Design & UX Principles
- [x] **Design**: Ensure minimal gradient usage; stick to modern/simple aesthetics.
- [x] **UX**: Add micro-animations and loading state transitions across the app.
- [x] **UX**: Implement active notification system (toasts/alerts) for progress, success, and errors globally.
- [x] **UX**: Convert all remaining data tables to have clickable, sortable column headers.
