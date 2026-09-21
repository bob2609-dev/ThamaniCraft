# SKILL-10: Implementation Lessons from ThamaniPoint

This document captures key architecture, UI, and backend patterns refined during the ThamaniPoint implementation. These patterns MUST be applied to ThamaniCraft to prevent regressions and maintain a robust, production-ready system.

## 1. Soft Deletion over Hard Deletion
**Pattern**: Master data entities (Products, Ingredients, Recipes, Customers) MUST implement an `isActive` boolean flag (default `true`) instead of being hard-deleted from the database via `repository.delete()`.
**Why**: Hard deleting a raw material or recipe breaks historical Batch Work Orders, Financial PnLs, and Invoices that reference that entity's ID.
**Implementation**:
- Add `@Column(name = "is_active", nullable = false) private Boolean isActive = true;` to entities.
- Override or create repository methods: `List<Product> findByIsActiveTrue();`.
- In controllers, `DELETE /{id}` endpoints should fetch the entity, set `isActive = false`, and save.

## 2. Event-Driven Rollbacks (Compensating Transactions)
**Pattern**: When a transactional document (e.g., Purchase Order, Batch Order, Sales Invoice) is deleted or voided, the system MUST emit a domain event (e.g., `batch.deleted`) to a RabbitMQ Topic Exchange.
**Why**: Monolithic synchronous rollbacks lead to tight coupling. Deleting a Batch Order must independently notify the Inventory Service to increment raw materials and decrement finished goods, and notify the Analytics Service to adjust daily production metrics.
**Implementation**:
- Emit event with key `batch.deleted` containing the transaction payload.
- Listeners in dependent services consume this event and execute compensating logic.

## 3. Atomic Database Operations for Stock
**Pattern**: Stock adjustments (increment/decrement) MUST be performed via atomic JPQL `@Modifying` queries rather than fetching the entity, adjusting the value in memory, and saving.
**Why**: Prevents race conditions when multiple users process sales or batch orders concurrently.
**Implementation**:
```java
@Modifying
@Query("UPDATE Ingredient i SET i.stockQuantity = GREATEST(0, i.stockQuantity - :quantity), i.updatedAt = CURRENT_TIMESTAMP WHERE i.id = :id AND i.tenantId = :tenantId")
int decrementStock(@Param("tenantId") UUID tenantId, @Param("id") UUID id, @Param("quantity") Integer quantity);
```

## 4. Two-Way Sync with User Prompts for Costing
**Pattern**: When receiving new inventory (Purchases) where the unit cost differs from the master catalog's "Buying Price" / "Cost Price", the UI MUST auto-detect the discrepancy and prompt the user to update the master catalog price.
**Why**: Ingredient prices fluctuate. If a user buys flour at a higher price but forgets to update the master ingredient cost, the Recipe BOM engine will calculate inaccurate (overstated) profit margins for all subsequent batches.
**Implementation**:
- Frontend compares the `unitCost` in the purchase form against the product's `costPrice`.
- If a diff exists, show a `Modal.confirm` on submission: "Do you want to update the master prices to match this purchase?"
- Backend exposes a `PUT /api/v1/catalog/ingredients/{id}` endpoint that accepts partial updates (just `costPrice`).

## 5. UI/UX: Printable A4 Financial Reports
**Pattern**: All analytical and financial reports (PnL, Batch Costing, Dispatch Notes) MUST include dedicated `@media print` CSS rules that force the layout into a single, clean A4 page export.
**Why**: Standard responsive CSS does not translate well to PDF/Print. Large margins and sidebars cause reports to spill over to multiple pages.
**Implementation**:
```css
@media print {
  .no-print, .ant-layout-sider, .ant-layout-header { display: none !important; }
  .printable-a4 {
    zoom: 0.70; /* Chrome/Safari scaling */
    transform: scale(0.70); /* Firefox scaling */
    transform-origin: top left;
    margin: 0 !important;
    padding: 0 !important;
  }
  @page { margin: 0.5cm; size: A4 portrait; }
}
```

## 6. Form Validation: Array Requirements
**Pattern**: Any dynamic form list (e.g., adding Ingredients to a Recipe, or Line Items to a Purchase) MUST include a validator ensuring at least one item exists before allowing submission.
**Why**: Prevents empty array payloads which can cause divide-by-zero errors in BOM calculations or empty invoices.
**Implementation**:
Use Ant Design's `Form.List` validator:
```javascript
rules={[{
  validator: async (_, items) => {
    if (!items || items.length < 1) {
      return Promise.reject(new Error('Please add at least one line item'));
    }
  },
}]}
```


## 7. Required Field Validation & Database Constraints
**Pattern**: Ensure application logic and test scripts rigorously validate `NOT NULL` database constraints before saving to prevent silent transaction failures.
**Why**: Missing fields (e.g., creating inventory without a `cost_price`) can cause downstream accounting events (like COGS calculation) to silently fail if the constraint is violated in the DB but not caught correctly by the application layer.

## 8. Clean Unique Identifiers for Users
**Pattern**: Never expose massive, raw UUID strings to users in the UI for generated references (e.g., `PURCHASE-3c108f95-007a-4273-a96e-da4b34fbcfff`). 
**Why**: UI aesthetics and usability suffer when referencing excessively long IDs.
**Implementation**:
- Always use a fallback ID that truncates UUIDs to the first 8 characters (`.substring(0, 8).toUpperCase()`) to provide clean, readable references in ledgers and receipts when explicit receipt numbers aren't available.

## 9. Explicit Date Selection for Accounting
**Pattern**: Silent defaults for transaction dates can cause accounting discrepancies. For manual journal entries or historical data entry, require an explicit `Date` field on the form.
**Why**: Ensuring the user manually confirms the posting date avoids entries being logged in the wrong financial period by accident.
**Implementation**:
- You can default it to the current time (e.g., `dayjs()`), but making it explicitly visible and required ensures the user verifies the correct posting date before submission.

## 10. Ant Design Modals & Form Instances
**Pattern**: When placing a `<Form>` inside a `<Modal>` using `Form.useForm()`, React strict mode and Ant Design may throw "useForm is not connected to any Form element" warnings.
**Why**: Modals lazy-load their children by default, causing the form instance to exist without an attached DOM node on initial render.
**Implementation**:
- Use the `forceRender` prop on the Modal to ensure the nested Form is mounted instantly in the background.
- Note: `destroyOnClose` is deprecated in favor of `destroyOnHidden` for modals in AntD v5.


## 11. Responsive Table Layouts without Squishing
**Pattern**: Ant Design tables with many columns MUST implement a minimum horizontal scroll threshold (e.g., `scroll={{ x: 1000 }}`) rather than removing horizontal scroll entirely.
**Why**: Removing `scroll={{ x: "max-content" }}` entirely forces the browser to squeeze all columns on small screens or split-window views, wrapping text into unreadable, single-character wide vertical columns. Using a numerical width threshold ensures columns only scroll horizontally when physically necessary.
**Implementation**:
```jsx
<Table 
  columns={columns} 
  dataSource={data} 
  scroll={{ x: 1000 }} // Enables scroll on screens < 1000px, responsive above it
/>
```

## 12. Deprecated Ant Design Props
**Pattern**: Proactively replace deprecated Ant Design properties as identified in console warnings.
**Why**: Keeping the console clean and reducing technical debt for future Ant Design upgrades.
**Implementation**:
- Replace `dropdownRender` with `popupRender` in `<Select>` components.

## 13. Containerized Backend Re-compilation
**Pattern**: Changes to Java Spring Boot source code (Controllers, Services, Entities) MUST be explicitly recompiled and their corresponding Docker containers rebuilt.
**Why**: Unlike the Next.js frontend which supports fast refresh/HMR, the Java backends run from compiled `.jar` files inside Docker. Modifying code without a rebuild leads to testing stale logic.
**Implementation**:
- Ensure changes are built: `mvn clean package`
- Rebuild the specific service container: `docker compose up -d --build <service-name>`
