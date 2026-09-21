# SKILL-06: B2B Wholesale, Delivery Notes & Dispatch

**Scope:** `craft-sales-service`  

---

## 1. Wholesale & Distribution Workflow

Manufacturers sell to supermarkets, cafes, retailers, and distributors in bulk:

```
[B2B Order Placed] --> [Pick & Pack Dispatch] --> [Print Delivery Note] --> [Issue Invoice & Settle]
```

---

## 2. Client Accounts & Credit Management

- **Credit Limit & Payment Terms**: (e.g. Max TZS 5,000,000 with Net 14 Days).
- **Client Ledger**: Tracks historical orders, outstanding invoices, payments, and ageing buckets (0-30 days, 31-60 days, 60+ days).
- **Delivery Note Generation**: Clean printable dispatch sheet with driver signature line and packing checklist.
- **Tanzania TRA Fiscalization**: Generates 18% standard VAT invoices with TRA QR code payload.\n