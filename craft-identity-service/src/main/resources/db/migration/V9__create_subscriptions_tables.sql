CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10, 2) NOT NULL,
    max_users INTEGER,
    included_modules TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    is_auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);

INSERT INTO subscription_plans (id, code, name, description, monthly_price, max_users, included_modules)
VALUES 
    (gen_random_uuid(), 'FREE', 'Free Tier', 'Basic features for startups', 0.00, 2, '["inventory", "recipes"]'),
    (gen_random_uuid(), 'PRO', 'Professional', 'Advanced features and more users', 49.00, 10, '["inventory", "recipes", "production", "sales"]'),
    (gen_random_uuid(), 'ENTERPRISE', 'Enterprise', 'Unlimited users and all modules', 149.00, NULL, '["inventory", "recipes", "production", "sales", "finance", "reports"]');
