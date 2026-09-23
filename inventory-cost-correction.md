# Inventory cost correction

- [x] Add a tenant-scoped, permission-protected cost correction endpoint with validation, stale-value protection and an atomic audit record.
- [x] Add an Inventory cost action with unit labels, required reason and stock-value preview; preserve existing theme and stock quantity.
- [x] Verify backend regression tests, frontend lint/build and development service migration/startup.

Historical receipts must remain unchanged. No automatic correction of existing prices.

Verification: 8 backend tests pass (including permissions and request validation). Frontend build and focused component lint pass. Full frontend lint has existing warnings. Browser interaction and a live authenticated correction have not been performed.

Development deployment: inventory service rebuilt and started; Flyway V7 applied successfully and audit table existence verified.
