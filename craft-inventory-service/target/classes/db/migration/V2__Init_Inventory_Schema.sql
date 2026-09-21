CREATE TABLE IF NOT EXISTS units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(64) NOT NULL,
    symbol VARCHAR(16) NOT NULL,
    base_unit_id UUID REFERENCES units_of_measure(id),
    conversion_factor NUMERIC(12, 6) DEFAULT 1.0,
    category VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    sku VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64),
    base_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    purchase_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    current_stock_base_qty NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    cost_per_base_unit NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    reorder_level_base_qty NUMERIC(14, 4) NOT NULL DEFAULT 10000.0000,
    storage_location VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    adjustment_type VARCHAR(32) NOT NULL,
    quantity_base_qty NUMERIC(14, 4) NOT NULL,
    total_cost_impact NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
