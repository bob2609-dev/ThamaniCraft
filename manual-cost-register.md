# Manual purchases and recipe overheads

- [x] Replace Finance projections with tenant-scoped equipment purchases and dated expenses; preserve legacy records.
- [x] Persist explicit additional recipe overhead; remove the Finance dependency from recipe costing.
- [x] Update Assets and recipe forms, retaining the Inventory palette and labelled compact controls.
- [x] Update PROGRESS and supersede the allocation decision; document future order costs (recipe plus extras).
- [x] Verify backend tests, migration SQL, client build and focused lint; report deployment/browser gaps.

No existing purchase, lease, recipe or inventory records are deleted. No automatic allocation or depreciation remains active.

Verified: Finance 7 tests, Production 11 tests, frontend simulation test, client build and focused lint. Migration rehearsal used table copies in a rolled-back transaction. Deployed Finance V2 and Production V3; Flyway success verified. HTTP page smoke checks passed. Authenticated browser save/reopen flows and visual checks remain pending.

Backup before migration: Postgres container `/tmp/thamanicraft-before-manual-register-20260922.dump`. Prefer fix-forward; reverting to the former depreciation implementation is not safe after new purchases with null legacy projection fields are recorded. Any full restore must be separately approved and reconcile subsequent records.
