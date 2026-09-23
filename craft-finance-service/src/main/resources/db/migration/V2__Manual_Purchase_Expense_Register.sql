-- Preserve legacy projection values, but new purchases do not require them.
ALTER TABLE fixed_assets
    ALTER COLUMN salvage_value DROP NOT NULL,
    ALTER COLUMN useful_life_months DROP NOT NULL,
    ALTER COLUMN allocation_type DROP NOT NULL,
    ADD COLUMN reference VARCHAR(255),
    ADD COLUMN notes VARCHAR(4000);
ALTER TABLE fixed_assets DROP CONSTRAINT fixed_assets_check;
ALTER TABLE fixed_assets ADD CONSTRAINT fixed_assets_salvage_value_check CHECK (salvage_value >= 0);

CREATE TABLE expenses (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('RENT','UTILITIES','MAINTENANCE','TRANSPORT','OTHER')),
    expense_date DATE NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    reference VARCHAR(255),
    notes VARCHAR(4000),
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_expenses_tenant_date ON expenses(tenant_id, expense_date DESC);
