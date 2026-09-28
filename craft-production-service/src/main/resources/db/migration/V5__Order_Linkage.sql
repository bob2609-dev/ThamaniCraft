ALTER TABLE production_batches
 ADD COLUMN order_id UUID,
 ADD COLUMN order_item_id UUID,
 ADD COLUMN generation_key VARCHAR(255);

CREATE INDEX idx_batches_order ON production_batches(tenant_id, order_id);
CREATE UNIQUE INDEX idx_batches_generation ON production_batches(tenant_id, generation_key) WHERE generation_key IS NOT NULL;
