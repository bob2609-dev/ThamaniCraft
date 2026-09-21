CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    yield_quantity NUMERIC(10, 2) NOT NULL,
    yield_uom_id UUID NOT NULL, -- references units_of_measure(id) in inventory service
    labor_cost_per_batch NUMERIC(12, 2) DEFAULT 0.00,
    energy_cost_per_batch NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL, -- references raw_materials(id) in inventory service
    quantity_required NUMERIC(14, 4) NOT NULL,
    waste_factor NUMERIC(6, 4) DEFAULT 0.0000,
    instructions VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    planned_yield NUMERIC(10, 2) NOT NULL,
    actual_yield NUMERIC(10, 2),
    scrap_count NUMERIC(10, 2),
    total_batch_cost NUMERIC(12, 2),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
