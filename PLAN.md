# ThamaniCraft

## Infrastructure & Gateway {#infrastructure}
tech: Nginx, RabbitMQ, Spring Cloud Gateway, Docker
files: [nginx/**, rabbitmq/**, rabbitscout/**, craft-gateway-service/**, docker-compose*.yml]
- [x] Configure gateway routing and discovery tech: `craft-gateway-service`

## Identity & Tenancy {#identity-service}
tech: Spring Boot, JWT, Postgres
files: [craft-identity-service/**, craft-common-security/**]
needs: [infrastructure]
- [x] Multitenant domain login and validation tech: `AuthServiceImpl.java`, `JwtAuthFilter.java`
- [x] Full-page tenant management endpoints tech: `craft-identity-service`
- [x] Implement subscription billing service and models {#sub-backend}
  tech: `SubscriptionPlan.java`, `SubscriptionServiceImpl.java`, `V9__create_subscriptions_tables.sql`
- [x] Implement manual subscription payment processing & invoice APIs
  by: agent

## Core ERP Backend {#erp-backend}
tech: Spring Boot, Postgres
files: [craft-inventory-service/**, craft-finance-service/**, craft-sales-service/**, craft-production-service/**, *.sql]
needs: [identity-service]
- [x] Basic ledger service and accounting controllers tech: `LedgerService.java`, `LedgerController.java`
- [x] Fixed asset management tracking tech: `FixedAssetRepository.java`
- [x] Seed tenant database with demo cake data tech: `insert_cake_data_bob_tenant.sql`

## Admin UI {#admin-ui}
tech: React, Ant Design, Vite
files: [thamanicraft-admin-ui/**]
needs: [identity-service]
- [x] Build brand-compliant login and sidebar layout tech: `thamanicraft-admin-ui/src/pages/Login.jsx`
- [x] Build subscription plans management page {#sub-admin-ui}
  tech: `Subscriptions.jsx`, `SubscriptionTab.jsx`
- [x] Build Payments Verification page for Admins to manually approve tenant payments
  by: agent
- [x] Add tenant invoice history and payment management to admin subscription tab {#admin-tenant-invoices}
  tech: `SubscriptionTab.jsx`, `subscriptionApi.js`
  by: gemini
- [x] Format module list as structured tags and multiselect across admin and client UIs {#module-display-fix}
  tech: `Subscriptions.jsx`, `SubscriptionTab.jsx`, `Billing.jsx`
  by: gemini
- [x] Add plan customer visibility toggle and direct tenant assignment {#plan-visibility-and-assignment}
  tech: `SubscriptionPlan.java`, `SubscriptionServiceImpl.java`, `Subscriptions.jsx`, `SubscriptionTab.jsx`
  by: gemini
  from: agent
- [x] Implement Admin Tenant Platform Dashboard {#admin-tenant-dashboard}
  tech: `AdminDashboardService.java`, `Dashboard.jsx`
  by: gemini
  from: agent
- [x] Implement live microservices socket health probes for Admin Dashboard {#live-microservices-health}
  tech: `AdminDashboardService.java`, `SystemMonitoringController.java`, `Dashboard.jsx`
  by: gemini
  from: agent
- [x] Implement module entitlements tab in tenant details and protect admin tenant suspension {#tenant-modules-tab}
  tech: `Tenant.java`, `TenantController.java`, `TenantService.java`, `ModulesTab.jsx`, `Tenants.jsx`, `TenantDetails.jsx`
  by: gemini
  from: agent
- [x] Deep link admin quick actions to target tabs via URL search params {#admin-quick-actions-tab-deeplink}
  tech: `Dashboard.jsx`, `Subscriptions.jsx`, `Settings.jsx`, `PlatformLogs.jsx`
  by: gemini
  from: agent

## Client Tenant UI {#client-ui}
tech: React, Ant Design, Vite
files: [thamanicraft-client-ui/**]
needs: [identity-service, erp-backend]
- [x] Build tenant login and dynamic domain branding tech: `thamanicraft-client-ui/src/pages/auth/Login.jsx`
- [x] Build tenant billing overview page {#sub-client-ui}
  tech: `Billing.jsx`, `subscriptionApi.js`
- [x] Add Invoices tab and Paybill payment instructions to Tenant Billing page
  by: agent
- [x] Restrict tenant UI sidebar and routes by subscription plan module entitlements {#module-entitlement-enforcement}
  tech: `AuthServiceImpl.java`, `usePermissions.js`, `MainLayout.jsx`, `Dashboard.jsx`
  by: gemini
  from: agent
- [x] Align pricing plan cards and subscribe buttons to bottom baseline {#plan-card-button-alignment}
  tech: `Billing.jsx`
  by: gemini
  from: agent
- [x] Format subscription prices and invoice amounts with thousand separators {#currency-thousand-separators}
  tech: `Billing.jsx`, `Subscriptions.jsx`, `SubscriptionTab.jsx`
  by: gemini
  from: agent

## decisions
- Rewrote the PLAN.md from scratch to reflect the true microservice and UI architecture of the ThamaniCraft repository, mapping all existing codebases into 5 high-level components. Checked off completed features backed by explicit evidence in the code (e.g. `Login.jsx`, `LedgerService.java`), marked `insert_cake_data_bob_tenant.sql` as currently in progress `[~]`, and maintained the future intent for Subscription/Billing scaffolding.
