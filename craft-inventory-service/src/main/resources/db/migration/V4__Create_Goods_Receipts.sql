CREATE TABLE goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    supplier_name VARCHAR(255),
    supplier_reference VARCHAR(128),
    received_by VARCHAR(128),
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    purchase_quantity NUMERIC(14,4) NOT NULL CHECK (purchase_quantity > 0),
    purchase_unit_cost NUMERIC(14,2) NOT NULL CHECK (purchase_unit_cost >= 0),
    base_quantity_received NUMERIC(14,4) NOT NULL CHECK (base_quantity_received > 0),
    total_cost NUMERIC(14,2) NOT NULL CHECK (total_cost >= 0)
);

CREATE INDEX idx_goods_receipts_tenant_received_at ON goods_receipts(tenant_id, received_at DESC);
