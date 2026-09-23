# Recipe sandbox and CapEx costing

> Superseded on 2026-09-22 by [manual-cost-register.md](manual-cost-register.md). The following is a historical implementation record, not the current costing policy.

Approved: separate Finance service, tenant-wide overhead per estimated monthly batch, estimates only (no journals).

- [x] Finance schema/API: assets, leases, monthly volume, date-aware depreciation and overhead summary.
- [x] Recipe backend includes Finance overhead; Finance failure must not silently underprice recipes.
- [x] Assets UI and temporary ingredient-price sandbox; no inventory writes from simulation.
- [x] Automated tests, builds, development deployment and progress documentation.
- [ ] Authenticated browser acceptance: asset/lease saves, calculated overhead and recipe simulation/reset.

Verified 2026-09-22: Finance 9 tests, Production 7 tests; frontend simulation test file/build/focused lint pass. All five integration containers run current images; Finance V1 and Identity V3 migrations verified. Actual browser flows remain unverified. No journals or ROI/payback implementation.

Rules: straight-line estimates start on purchase date, stop at useful-life end; book value uses completed months. Maintenance assets still depreciate. Only DIRECT_PRODUCTION assets are allocated. Active leases include both boundary dates. No actual ROI claims before sales/production tracking exists.
