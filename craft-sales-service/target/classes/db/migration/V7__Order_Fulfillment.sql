ALTER TABLE orders ADD COLUMN fulfillment_status VARCHAR(20) NOT NULL DEFAULT 'UNFULFILLED' CHECK (fulfillment_status IN ('UNFULFILLED','FULFILLED'));
ALTER TABLE orders ADD COLUMN fulfilled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN fulfilled_by UUID;
ALTER TABLE orders ADD COLUMN carrier_or_collector VARCHAR(255);
ALTER TABLE orders ADD COLUMN fulfillment_notes VARCHAR(1000);
