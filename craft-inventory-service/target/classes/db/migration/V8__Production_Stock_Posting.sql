CREATE TABLE IF NOT EXISTS finished_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    sku VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64),
    base_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    current_stock_base_qty NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    cost_per_base_unit NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE inventory_adjustments ADD COLUMN finished_product_id UUID REFERENCES finished_products(id);
ALTER TABLE inventory_adjustments ALTER COLUMN raw_material_id DROP NOT NULL;
ALTER TABLE inventory_adjustments ADD CONSTRAINT chk_inventory_adjustments_target CHECK (
    (raw_material_id IS NOT NULL AND finished_product_id IS NULL) OR
    (raw_material_id IS NULL AND finished_product_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS inventory_inbox (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);
