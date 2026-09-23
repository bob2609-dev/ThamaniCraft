CREATE TABLE order_payments (
 id UUID PRIMARY KEY,
 order_id UUID NOT NULL REFERENCES orders(id),
 request_id UUID NOT NULL,
 amount NUMERIC(16,2) NOT NULL CHECK(amount > 0),
 received_at TIMESTAMPTZ NOT NULL,
 method VARCHAR(20) NOT NULL CHECK(method IN ('CASH','MOBILE_MONEY','BANK','OTHER')),
 reference VARCHAR(255),
 actor UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(order_id,request_id)
);
CREATE TABLE payment_reversals (
 payment_id UUID PRIMARY KEY REFERENCES order_payments(id),
 reason VARCHAR(1000) NOT NULL,
 actor UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
