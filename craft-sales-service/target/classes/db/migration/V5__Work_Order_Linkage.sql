ALTER TABLE sales.order_items
 ADD COLUMN work_order_id UUID,
 ADD COLUMN work_order_status VARCHAR(32);
