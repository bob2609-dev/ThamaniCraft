CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- We add category_id to raw_materials, but to avoid dropping the old 'category' column
-- and breaking existing data temporarily, we'll keep both and make category_id nullable for now.
-- In a real prod migration, we'd migrate data from category -> category_id and drop the old column.
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES item_categories(id);
