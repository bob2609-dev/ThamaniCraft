-- V1 may have been baselined. Preserve installations where it did run.
CREATE TABLE IF NOT EXISTS production_batches (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
 recipe_id UUID NOT NULL REFERENCES recipes(id), status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
 planned_yield NUMERIC(10,2) NOT NULL, actual_yield NUMERIC(10,2), scrap_count NUMERIC(10,2),
 total_batch_cost NUMERIC(12,2), started_at TIMESTAMP, completed_at TIMESTAMP,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE production_batches
 ADD COLUMN reference VARCHAR(255),
 ADD COLUMN notes VARCHAR(4000),
 ADD COLUMN scheduled_date DATE,
 ADD COLUMN version INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN recipe_name VARCHAR(255),
 ADD COLUMN output_uom_id UUID,
 ADD COLUMN output_unit VARCHAR(255),
 ADD COLUMN planned_labor NUMERIC(24,4),
 ADD COLUMN planned_energy NUMERIC(24,4),
 ADD COLUMN planned_overhead NUMERIC(24,4),
 ADD COLUMN planned_cost NUMERIC(24,4),
 ADD COLUMN created_by UUID,
 ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX idx_batches_tenant_created ON production_batches(tenant_id, created_at DESC);
CREATE TABLE production_batch_ingredients (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
 batch_id UUID NOT NULL REFERENCES production_batches(id),
 raw_material_id UUID NOT NULL, material_name VARCHAR(255) NOT NULL,
 base_uom_id UUID NOT NULL, unit VARCHAR(255) NOT NULL,
 planned_quantity NUMERIC(24,4) NOT NULL CHECK (planned_quantity > 0),
 unit_cost NUMERIC(14,4) NOT NULL CHECK (unit_cost >= 0),
 line_cost NUMERIC(24,4) NOT NULL CHECK (line_cost >= 0),
 instructions VARCHAR(255),
 UNIQUE (tenant_id,batch_id,raw_material_id)
);
CREATE TABLE production_batch_history (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, batch_id UUID NOT NULL REFERENCES production_batches(id),
 action VARCHAR(32) NOT NULL, actor_id UUID NOT NULL, recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_batch_history ON production_batch_history(tenant_id,batch_id,recorded_at);
