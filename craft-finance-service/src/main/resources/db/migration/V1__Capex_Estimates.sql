CREATE TABLE fixed_assets (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, name VARCHAR(255) NOT NULL,
 category VARCHAR(32) NOT NULL, purchase_date DATE NOT NULL,
 purchase_cost NUMERIC(14,2) NOT NULL CHECK(purchase_cost >= 0),
 salvage_value NUMERIC(14,2) NOT NULL CHECK(salvage_value >= 0 AND salvage_value <= purchase_cost),
 useful_life_months INTEGER NOT NULL CHECK(useful_life_months > 0),
 status VARCHAR(32) NOT NULL CHECK(status IN ('ACTIVE','MAINTENANCE','DISPOSED','WRITTEN_OFF')),
 allocation_type VARCHAR(32) NOT NULL CHECK(allocation_type IN ('DIRECT_PRODUCTION','GENERAL_OVERHEAD')),
 created_by UUID NOT NULL, updated_by UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_assets_tenant ON fixed_assets(tenant_id);
CREATE TABLE facility_leases (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, title VARCHAR(255) NOT NULL,
 start_date DATE NOT NULL, end_date DATE NOT NULL CHECK(end_date >= start_date),
 total_amount NUMERIC(14,2) NOT NULL CHECK(total_amount >= 0),
 billing_period_months INTEGER NOT NULL CHECK(billing_period_months > 0),
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_by UUID NOT NULL, updated_by UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leases_tenant ON facility_leases(tenant_id);
CREATE TABLE overhead_settings (
 tenant_id UUID PRIMARY KEY, monthly_batches INTEGER NOT NULL CHECK(monthly_batches > 0),
 updated_by UUID NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
