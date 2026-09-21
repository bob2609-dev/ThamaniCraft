# SKILL-07: Automated Manufacturing Cost Accounting

**Scope:** `craft-finance-service`  
**Standard:** Automated Invisible Double-Entry Bookkeeping for Manufacturing Operations  

---

## 1. General Ledger Account Mappings

| Account Code | Account Name | Type | Description |
| :--- | :--- | :--- | :--- |
| **1300** | Raw Materials Inventory | Asset | Value of unbaked/unprocessed ingredients |
| **1320** | Work in Progress (WIP) | Asset | Value of batches currently in ovens/processing |
| **1350** | Finished Goods Inventory | Asset | Packaged items ready for sale/dispatch |
| **5010** | Cost of Goods Sold (COGS) | Expense | Direct material + labor cost of products sold |
| **5020** | Production Scrap & Spoilage | Expense | Value of ruined batches or expired raw items |
| **4010** | Wholesale & Retail Revenue | Revenue | Total gross sales |

---

## 2. Automated Trigger Journal Matrix

| Front-End Event | Debit (Dr) | Credit (Cr) |
| :--- | :--- | :--- |
| **Receive Raw Material GRN** | `1300 Raw Materials` | `2010 Accounts Payable` |
| **Start Production Batch** | `1320 Work in Progress (WIP)` | `1300 Raw Materials` |
| **Complete Production Batch** | `1350 Finished Goods` | `1320 Work in Progress (WIP)` |
| **Scrap / Spoilage Recorded** | `5020 Production Spoilage` | `1300 Raw Materials` |
| **Wholesale Dispatch Delivered** | `1200 Accounts Receivable` / `1010 Cash`<br>`5010 Cost of Goods Sold` | `4010 Sales Revenue`<br>`1350 Finished Goods` |\n
## 3. Manual Journal Entries
**Pattern**: Allow authorized accountants to create manual journal entries for adjustments (e.g., depreciation, accruals). 
- **Requirement**: Always include a mandatory explicit `Date` field. Do not rely on server-side `LocalDateTime.now()` silently.
- **Reference**: Provide a readable reference number (e.g., ADJ-YYYYMM-001) instead of exposing raw UUIDs.
