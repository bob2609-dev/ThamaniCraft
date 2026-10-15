ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS is_visible_to_customers BOOLEAN NOT NULL DEFAULT TRUE;
