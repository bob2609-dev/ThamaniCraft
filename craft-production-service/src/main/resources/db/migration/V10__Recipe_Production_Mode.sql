-- Add production_mode to recipes table
CREATE TYPE production_mode AS ENUM ('BATCH_PRE_MADE', 'JUST_IN_TIME');

ALTER TABLE recipes 
ADD COLUMN production_mode production_mode NOT NULL DEFAULT 'BATCH_PRE_MADE';

-- Add uom_id to recipe_items to support SmartUOM conversions natively
ALTER TABLE recipe_items
ADD COLUMN uom_id UUID;

-- We don't add NOT NULL yet, because existing data might be present.
-- If this was a fresh database, we could. Since we wiped it, we are mostly safe, but we'll leave it nullable.
-- However, let's create a foreign key to units_of_measure.
ALTER TABLE recipe_items
ADD CONSTRAINT fk_recipe_items_uom FOREIGN KEY (uom_id) REFERENCES units_of_measure(id);
