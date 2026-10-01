# ThamaniCraft — Simplification Handover

Last updated: 2026-10-01 (Africa/Dar_es_Salaam).

## Purpose of this Handover

This specific handover document manages the pivot from a complex, manufacturing ERP system (with double-entry ledgers, complex BOM costing, UOM conversions, and multi-step work order lifecycles) to a **simplified, Point-of-Sale (POS) and action-oriented experience**.

This document complements the main `HANDOVER.md` but is strictly scoped to track the transition logic and state of the Facade APIs and UI redesign.

## Current System State (Pre-Simplification)

As of the start of this pivot:

1. **Sales**: Multi-step process (Draft -> Confirm -> Map Recipe -> Pay -> Dispatch). Heavily relies on users clicking through lists and modals.
2. **Inventory**: Requires users to define Base Units and Purchase Units manually, and receive stock via Goods Receipt Notes (GRNs).
3. **Production**: Requires Work Order scheduling (Draft -> Scheduled -> In Progress -> Complete).
4. **Finance**: True double-entry ledger requiring users to understand Journal Entries.
5. **Recipes**: Costing is highly complex, requiring waste percentages, labor, energy, and manual UOM conversion factors.

## Target State (The Pivot)

1. **Facade APIs**: We will wrap the complexity of the ERP into 4 single-click REST endpoints in the backend (Checkout, Quick Refill, Quick Make, Quick Expense).
2. **Smart Culinary Dictionary**: The backend will handle volume/weight conversions automatically (e.g., Liters to Cups) so the user does no math.
3. **POS Frontend**: The UI will be flattened. The dashboard will be 4 massive buttons. Sales will be a visual POS grid.
4. **Dual Mode Deduction**:
   - `BATCH_PRE_MADE`: Raw materials are deducted when the user clicks "Make Product". Finished goods are deducted on POS sale.
   - `JUST_IN_TIME`: Finished goods step is skipped. Raw materials are deducted instantly at the moment of POS sale.

## Known Risks & Transition Guidelines

* **Data Preservation**: Do not DROP existing tables (like `journal_entries` or `production_batches`). The Facade APIs should write to these existing tables to maintain data integrity and allow for a potential toggle back to "Advanced Mode" in the future.
* **Existing Recipes**: Existing recipes might not map perfectly to the new `SmartUOMConverter`. A migration script or fallback logic might be needed for recipes that used custom, non-standard UOM strings.
* **Authentication**: The new Facade APIs must still enforce Tenant separation and JWT validation. Do not bypass security filters for the sake of simplicity.

## Current Focus / Next Steps

All major UI simplification phases and backend Facade APIs are complete. Global standard UOMs are fully functional and integrated, and the E2E integration tests have successfully verified POS, UOM conversions, Replenishment, and Production workflows. The Dashboard charts and metrics have been refined based on user feedback.

The next phase involves:
1. Monitoring production usage for any edge-case UOM conversion failures.
2. Tenant Auto-seeding logic (Admin Module deferred to later).

See `simplification-plan.md` for the original roadmap and `simplification-progress.md` for the checklist.

## Design Guidelines (Frontend)
1. **Modern & Simple**: UI elements must be simple and clean. Use animations wherever possible to make the application feel responsive.
2. **Minimal Gradients**: Avoid using gradients too much. Stick to solid colors and subtle shadows.
3. **User Notifications**: Actively notify the user on progress, completion, and errors using on-screen messages and animations with clear, understandable text.
4. **Sortable Tables**: All data tables must allow users to sort columns by clicking on the column headers.
