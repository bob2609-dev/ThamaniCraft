# Dashboard, Reports, and Settings Implementation Plan

Status: Proposed
Date: 2026-09-26

## 1. Dashboard
**Goal:** Provide a high-level operational overview immediately upon login.
**Implementation:**
- The `Dashboard.jsx` will fetch data directly from existing backend APIs (`Sales`, `Production`, `Inventory`, `Finance`) concurrently.
- No new backend API is strictly necessary since we can aggregate data in the browser.
- **Proposed Metrics:**
  - **Sales:** Total revenue (completed/paid orders), number of pending open orders.
  - **Production:** Active batches `IN_PROGRESS` vs `COMPLETED`.
  - **Inventory:** Quick glance at low stock alerts for critical raw materials.
  - **Recent Activity:** A combined feed of recently completed orders or batches.

## 2. Reports
**Goal:** Provide detailed table views and data exports for business analysis.
**Implementation:**
- Add date-range filters and report-type selectors in `Reports.jsx`.
- **Proposed Reports:**
  - **Sales & Margin Report:** Uses the existing costing summary to show revenue, recipe cost, actual production cost, and gross margin per order across a date range.
  - **Production Yield Report:** Summarizes planned vs. actual yield and scrap counts across batches.
  - **Inventory Valuation:** Shows current stock levels multiplied by average unit cost.
- **Export:** Add simple "Export to CSV" buttons using frontend Blob generation.

## 3. Settings (User Management)
**Goal:** Allow the `OWNER` to invite staff and assign permissions.
**Implementation:**
- **Backend (`craft-identity-service`):**
  - Create a new `UserController` with endpoints:
    - `GET /api/users` (list users for the tenant).
    - `POST /api/users` (create a new user/staff member).
    - `PUT /api/users/{id}/roles` (update permissions).
  - Define roles clearly (e.g., `VIEW_SALES`, `PROCESS_SALES`, `VIEW_INVENTORY`, `PROCESS_INVENTORY`, `RECORD_PAYMENTS`, etc.).
- **Frontend (`Settings.jsx`):**
  - Provide a table of users.
  - Add a "Create User" modal with checkboxes for each permission.
  - Add "Change Password" capability for the currently logged-in user.

## Next Steps
Please review the proposed functionality above. 
- Are there specific metrics or reports you absolutely need included?
- Should we prioritize one of these three modules to start with?
