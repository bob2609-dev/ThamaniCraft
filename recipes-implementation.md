# Recipes and BOM

Create tenant-scoped recipes using material base units and current weighted costs. Saving recipes never deducts stock; batch execution is a later feature.

- [ ] Add authenticated recipe list, detail, save, archive, and costing APIs with tenant validation.
- [ ] Isolate production Flyway history and provision recipe tables on existing installations.
- [ ] Build a compact Inventory-themed recipe modal with ingredients, waste, overheads, and live costing.
- [ ] Verify costing and tenant boundaries, build frontend, deploy production service, and check authenticated endpoints.

The current deployment shares one PostgreSQL database. Recipe costing reads inventory tables with explicit tenant filters; inventory ownership and stock writes stay in the inventory service.
