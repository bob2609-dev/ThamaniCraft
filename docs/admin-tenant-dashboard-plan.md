# Admin Tenant Dashboard Implementation Plan

## Goal
Implement a high-fidelity, comprehensive **Admin Platform & Tenant Dashboard** (`/` route in `thamanicraft-admin-ui`), providing platform administrators with real-time visibility into tenant metrics, monthly recurring revenue (MRR), subscription distributions, pending invoice verification workflows, recent tenant activity, and underlying system health.

---

## 1. Architecture & Data Flow

### 1.1 Backend Aggregation Endpoint (`craft-identity-service`)
Create a dedicated aggregated dashboard endpoint:
- **Route:** `GET /api/admin/metrics/dashboard`
- **Security:** `@PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('VIEW_SYSTEM_LOGS')")`
- **Payload Structure:**
  ```json
  {
    "totalTenants": 10,
    "activeTenants": 9,
    "suspendedTenants": 1,
    "mrr": 263994.00,
    "activeSubscriptions": 8,
    "pendingInvoicesCount": 2,
    "planDistribution": [
      { "code": "FREE", "name": "Free Tier", "count": 3, "price": 0.00 },
      { "code": "PRO", "name": "Professional", "count": 5, "price": 21999.00 },
      { "code": "ENTERPRISE", "name": "Enterprise", "count": 2, "price": 43999.00 }
    ],
    "recentTenants": [
      {
        "id": "uuid",
        "name": "bpcakes",
        "displayName": "BP Cakes & Pastries",
        "active": true,
        "createdAt": "2026-10-10T12:00:00",
        "planCode": "PRO",
        "planName": "Professional"
      }
    ],
    "systemHealth": {
      "status": "UP",
      "services": {
        "craft-gateway-service": "UP",
        "craft-identity-service": "UP",
        "craft-inventory-service": "UP",
        "craft-production-service": "UP",
        "postgres": "UP",
        "rabbitmq": "UP"
      }
    }
  }
  ```

### 1.2 Backend Implementation Files:
1. `craft-identity-service/src/main/java/com/thamanicraft/identity/dto/AdminDashboardStatsDto.java`: DTO defining summary metrics, plan distributions, and recent tenant items.
2. `craft-identity-service/src/main/java/com/thamanicraft/identity/service/AdminDashboardService.java`: Service calculating MRR, counting active/suspended tenants, querying plan distribution, and compiling recent tenants.
3. `craft-identity-service/src/main/java/com/thamanicraft/identity/controller/SystemMonitoringController.java`: Exposes `GET /api/admin/metrics/dashboard`.

---

## 2. Frontend Implementation (`thamanicraft-admin-ui`)

### 2.1 API Client Integration
- Update `thamanicraft-admin-ui/src/utils/identityApi.js` to export `fetchAdminDashboardStats()`.

### 2.2 Dashboard UI Page (`thamanicraft-admin-ui/src/pages/Dashboard.jsx`)
Adheres to `DESIGN.md` (Amber `#D97706`, `card_border_radius: 12px`, dark mode contrast, zero horizontal scroll, responsive grid).

**Components:**
1. **Header Banner:**
   - Welcome title, current date/time, and Quick Refresh button with loading spinner.
2. **KPI Stat Cards (Row 1):**
   - **Total Tenants:** Count of total registered tenants, with sub-tags for Active (green) and Suspended (red).
   - **Monthly Recurring Revenue (MRR):** TZS formatted with comma thousand separators and two decimals (e.g. `TZS 263,994.00`), showing annualized run rate (ARR).
   - **Active Subscriptions:** Count of active tenant licenses, highlighting paying vs free tiers.
   - **Pending Invoices:** Count of payments awaiting review, with warning badge and direct link to review modal.
3. **Distribution & Operations (Row 2):**
   - **Subscription Plan Distribution Card:** Progress bars / percentages showing tenant distribution across Free Tier, Professional, and Enterprise.
   - **Platform Services Health Card:** Grid of system components (Gateway, Identity, Inventory, Production, PostgreSQL, RabbitMQ) with green pulsing status badges.
4. **Recent Tenants & Quick Actions (Row 3):**
   - **Recent Tenants Table:** Showing latest businesses onboarded, subdomain slug, active status, subscription plan tag, creation date, and direct "Manage" navigation button to `/tenants/:id`.
   - **Admin Quick Actions:** Quick modal launcher for "New Tenant", link to "Manage Plans", "Review Invoices", and "System Logs".

---

## 3. Verification & Acceptance Criteria
- [ ] Backend compiles without errors and passes tests.
- [ ] `GET /api/admin/metrics/dashboard` returns accurate metrics.
- [ ] Admin UI compiles and builds with zero errors.
- [ ] All prices/currency strings formatted with thousand separators.
- [ ] Dark mode and light mode both render with high contrast and proper brand tokens.
- [ ] Clicking on a tenant in Recent Tenants navigates directly to `/tenants/:id`.
- [ ] Documentation (`docs/PROGRESS.md`, `docs/HANDOVER.md`, `PLAN.md`) updated.
