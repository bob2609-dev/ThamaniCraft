# ADR-001: Finance-owned CapEx estimates

## Status

Superseded by user approval on 2026-09-22: use a manual purchase-and-expense register and explicitly entered recipe overheads. No equipment depreciation or expected monthly batches. See [current implementation plan](../../manual-cost-register.md). The decision below is historical, not the current implementation.

## Decision

Finance owns asset, lease and monthly batch-volume records in a separate PostgreSQL schema. Production calls its authenticated overhead summary API, forwarding the current user's bearer token. Each recipe includes the same tenant-wide rate: monthly direct-production depreciation plus active rent divided by estimated monthly batches.

## Trade-offs

A separate service follows the documented ownership boundary but adds a runtime dependency. Timeouts and explicit errors prevent Finance outages from silently producing underpriced recipes. An empty register costs zero; a nonempty cost pool without batch-volume configuration cannot produce a rate.

Ingredient price overrides are browser-only simulations and are not persisted with recipes or inventory. Depreciation/book values are estimates, not accounting postings or tax calculations. ROI, journals and production execution remain separate work.
