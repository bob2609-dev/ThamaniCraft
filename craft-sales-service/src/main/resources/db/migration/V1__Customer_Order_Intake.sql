CREATE TABLE customers (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, name VARCHAR(255) NOT NULL,
 phone VARCHAR(40) NOT NULL, email VARCHAR(255), address VARCHAR(1000), notes VARCHAR(4000),
 version INTEGER NOT NULL DEFAULT 0, created_by UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX customers_tenant ON customers(tenant_id);
CREATE TABLE orders (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, request_id UUID NOT NULL,
 customer_id UUID NOT NULL REFERENCES customers(id), customer_name VARCHAR(255) NOT NULL,
 customer_phone VARCHAR(40) NOT NULL, customer_email VARCHAR(255),
 due_at TIMESTAMPTZ NOT NULL, fulfilment VARCHAR(20) NOT NULL CHECK (fulfilment IN ('COLLECTION','DELIVERY')),
 delivery_address VARCHAR(1000), notes VARCHAR(4000), discount_note VARCHAR(1000),
 subtotal NUMERIC(16,2) NOT NULL, delivery_charge NUMERIC(16,2) NOT NULL CHECK(delivery_charge>=0),
 discount_amount NUMERIC(16,2) NOT NULL CHECK(discount_amount>=0),
 total NUMERIC(16,2) NOT NULL CHECK(total>=0), deposit_required NUMERIC(16,2) NOT NULL CHECK(deposit_required>=0 AND deposit_required<=total),
 status VARCHAR(20) NOT NULL DEFAULT 'NEW', created_by UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(tenant_id,request_id)
);
CREATE INDEX orders_tenant_due ON orders(tenant_id,due_at);
CREATE TABLE order_items (
 id UUID PRIMARY KEY, order_id UUID NOT NULL REFERENCES orders(id), position INTEGER NOT NULL,
 description VARCHAR(255) NOT NULL, quantity NUMERIC(12,4) NOT NULL CHECK(quantity>0),
 unit VARCHAR(40) NOT NULL, unit_price NUMERIC(12,2) NOT NULL CHECK(unit_price>=0),
 line_total NUMERIC(16,2) NOT NULL, instructions VARCHAR(1000)
);
