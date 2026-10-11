# ThamaniCraft Admin Portal Implementation Plan

## Overview
This plan outlines the roadmap for building the `thamanicraft-admin-ui` application. The admin portal will serve as the central hub for system configuration, user management, security policies, and system auditing, completely decoupled from the day-to-day point-of-sale operations of the client UI.

## Phase 1: Foundation & Authentication
* **Goal**: Establish the base application architecture and secure it via the Identity Service.
* **Tasks**:
  * [X] Initialize UI component library (Ant Design or Tailwind).
  * [X] Set up routing (React Router) with protected routes.
  * [X] Integrate JWT-based authentication with `craft-identity-service`.
  * [X] Create the Login Page and Base Admin Layout (Sidebar, Header).
* **Verification**: Verify a valid Admin user can log in and access the dashboard, while unauthenticated users are redirected to login.

## Phase 2: User & Role Management (RBAC)
* **Goal**: Build interfaces to manage staff access and permissions.
* **Tasks**:
  * [x] **Users List**: Display all registered users with their active status.
  * [x] **User Details**: Edit user profiles, reset passwords, and toggle active status.
  * [x] **Role Management**: Create/Edit roles (e.g., Cashier, Manager, Inventory Admin).
  * [x] **Permission Assignment**: UI matrix to assign granular system permissions to roles.
* **Verification**: Test creating a user, assigning a role, and ensuring they have the correct JWT claims upon login.

## Phase 3: System Configurations & Master Data
* **Goal**: Centralize global configurations that affect the entire ThamaniCraft ecosystem.
* **Tasks**:
  * [ ] **Units of Measure (UOM)**: Add, edit, and disable UOMs.
  * [ ] **Tax & Financial Configs**: Manage global tax rates, default currencies, and ledger account mappings.
  * [ ] **Store/Branch Settings**: (If applicable) manage different store locations and details.
* **Verification**: Ensure adding a new UOM in the Admin UI makes it immediately available in the Client UI dropdowns.

## Phase 4: Audit & System Monitoring
* **Goal**: Provide visibility into system health and user actions.
* **Tasks**:
  * [ ] **Audit Trail Dashboard**: View a log of critical actions (who changed what, and when).
  * [ ] **System Metrics**: Overview of system health, active users, and recent errors.
  * [ ] **RabbitMQ Event Viewer**: Basic integration to view recent domain events flowing through the system.
* **Verification**: Trigger a manual inventory adjustment in the Client UI and verify it appears in the Admin Audit Trail.

## Phase 5: Polish & Deployment
* **Goal**: Finalize UX and prepare for production.
* **Tasks**:
  * [ ] Implement Responsive Design for tablet and mobile admin access.
  * [ ] Review Docker configurations (`thamanicraft-admin-ui/Dockerfile`).
  * [ ] Final end-to-end integration testing.

## Phase 6: Tenant Management (Multi-Tenancy)
* **Goal**: Manage client businesses (tenants) from the admin portal.
* **Tasks**:
  * [x] **Backend Entity**: Create `Tenant` entity in `craft-identity-service` with `id`, `name` (slug), `displayName`, and `isActive` flag.
  * [x] **Backend API**: Implement `TenantController` with CRUD operations (`GET`, `POST`, `PUT`, toggle status).
  * [x] **Frontend Integration**: Update `identityApi.js` with tenant API calls.
  * [x] **UI Implementation**: Update `Tenants.jsx` with a data table, create modal, and edit modal.
  * [x] **Database Migration**: Add a Flyway migration script for the `tenants` table.
* **Verification**: Verify that a super admin can create a new tenant, edit its display name, and suspend it from the UI.
