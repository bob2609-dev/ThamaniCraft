ALTER TABLE orders ADD COLUMN version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN order_number BIGINT GENERATED ALWAYS AS IDENTITY;
ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX orders_number_unique ON orders(order_number);
CREATE TABLE order_history (
 id UUID PRIMARY KEY, order_id UUID NOT NULL REFERENCES orders(id),
 action VARCHAR(30) NOT NULL, reason VARCHAR(1000) NOT NULL,
 old_discount NUMERIC(16,2), new_discount NUMERIC(16,2),
 actor UUID NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX order_history_order ON order_history(order_id,created_at);
