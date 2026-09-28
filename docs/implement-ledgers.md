# Feature Plan: Implement Financial Ledgers

## Goal
Add a double-entry ledger system to `craft-finance-service` and integrate it into the `thamanicraft-client-ui` under the Reports/Finance section. This is modeled after the successful implementation in ThamaniPoint.

## Backend: `craft-finance-service`
1. **Entities & Enums**:
   - `AccountType` (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
   - `Account` (code, name, type, balance, isSystem, tenantId)
   - `JournalEntry` (reference, description, entryDate, tenantId)
   - `JournalLine` (account, debitAmount, creditAmount)
2. **Repositories**:
   - `AccountRepository`
   - `JournalEntryRepository`
3. **Service**: `LedgerService`
   - Method to initialize default chart of accounts (Cash, AR, AP, Inventory, Sales Revenue, COGS, etc.)
   - Method to post a balanced journal entry and update account balances.
4. **Controller**: `LedgerController`
   - `GET /api/v1/finance/ledger/trial-balance`: Fetch all accounts and their balances.
   - `GET /api/v1/finance/ledger/journal`: Fetch journal entries.
   - `POST /api/v1/finance/ledger/journal`: Post manual entries.

## Frontend: `thamanicraft-client-ui`
1. **API Integration**: Add ledger endpoints to `services/financeApi.js`.
2. **Ledger UI Component**: 
   - A new tab/section in the `Reports` module (or a dedicated `Finance` module) to view the Trial Balance.
   - A sub-section to view the Journal (General Ledger).
   - A modal to create manual Journal Entries (with debit/credit balancing validation).

## Execution Steps
- [x] Step 1: Implement backend entities, repositories, and the `LedgerService`.
- [x] Step 2: Expose backend endpoints in `LedgerController`.
- [x] Step 3: Implement frontend API calls and the Ledger views in `Reports.jsx` (or a dedicated `Ledger.jsx`).
- [ ] Step 4: Verify end-to-end (create a journal entry, ensure debits = credits, check updated account balances).
