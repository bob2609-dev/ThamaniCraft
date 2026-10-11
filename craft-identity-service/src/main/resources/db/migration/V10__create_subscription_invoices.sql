CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan_code VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    billing_period_start TIMESTAMP NOT NULL,
    billing_period_end TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL, -- UNPAID, PENDING_VERIFICATION, PAID, CANCELLED
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    proof_url TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
