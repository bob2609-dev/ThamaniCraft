ALTER TABLE recipes ADD COLUMN suggested_price numeric(12,2) DEFAULT 0;
UPDATE recipes SET suggested_price = 0; -- We don't have unit cost in SQL easily, so default 0
ALTER TABLE recipes DROP COLUMN target_margin;
