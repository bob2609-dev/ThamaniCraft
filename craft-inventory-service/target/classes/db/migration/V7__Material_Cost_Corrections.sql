CREATE TABLE material_cost_corrections (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    base_uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    stock_quantity NUMERIC(14,4) NOT NULL,
    old_cost NUMERIC(14,4) NOT NULL,
    new_cost NUMERIC(14,4) NOT NULL CHECK (new_cost >= 0),
    reason VARCHAR(500) NOT NULL,
    corrected_by UUID NOT NULL,
    corrected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_material_cost_corrections_material
    ON material_cost_corrections(tenant_id, raw_material_id, corrected_at);
