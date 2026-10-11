-- Recipe lines flagged here (e.g. cake boxes, toppers) are not scaled at POS;
-- the cashier confirms the exact quantity per cart line instead.
ALTER TABLE recipe_items ADD COLUMN IF NOT EXISTS confirm_at_pos BOOLEAN NOT NULL DEFAULT FALSE;
