-- Existing shared databases may baseline V1 without executing it.
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, description TEXT,
    yield_quantity NUMERIC(10,2) NOT NULL, yield_uom_id UUID NOT NULL,
    labor_cost_per_batch NUMERIC(12,2) DEFAULT 0,
    energy_cost_per_batch NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL, quantity_required NUMERIC(14,4) NOT NULL,
    waste_factor NUMERIC(6,4) DEFAULT 0, instructions VARCHAR(255)
);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_recipes_tenant_active ON recipes(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(tenant_id, recipe_id);
