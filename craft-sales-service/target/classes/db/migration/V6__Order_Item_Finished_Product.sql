ALTER TABLE order_items ADD COLUMN finished_product_id UUID;
ALTER TABLE order_items ADD COLUMN finished_product_name VARCHAR(255);
