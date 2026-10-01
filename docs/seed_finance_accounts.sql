-- Seed Finance Accounts
-- This script manually seeds the standard chart of accounts into the finance.accounts table.
-- It uses ON CONFLICT to avoid duplicate key errors if the accounts already exist.
-- Note: Replace '00000000-0000-0000-0000-000000000000' with the actual tenant_id if required for a specific tenant,
-- but the default system tenant in ThamaniCraft development usually matches this UUID.

INSERT INTO finance.accounts (tenant_id, code, name, type, balance, is_system) VALUES
('00000000-0000-0000-0000-000000000000', '1000', 'Cash', 'ASSET', 0.00, true),
('00000000-0000-0000-0000-000000000000', '1100', 'Accounts Receivable', 'ASSET', 0.00, true),
('00000000-0000-0000-0000-000000000000', '1200', 'Inventory', 'ASSET', 0.00, true),
('00000000-0000-0000-0000-000000000000', '2000', 'Accounts Payable', 'LIABILITY', 0.00, true),
('00000000-0000-0000-0000-000000000000', '3000', 'Owner''s Equity', 'EQUITY', 0.00, true),
('00000000-0000-0000-0000-000000000000', '4000', 'Sales Revenue', 'REVENUE', 0.00, true),
('00000000-0000-0000-0000-000000000000', '5000', 'Cost of Goods Sold', 'EXPENSE', 0.00, true),
('00000000-0000-0000-0000-000000000000', '5100', 'Operating Expenses', 'EXPENSE', 0.00, true),
('00000000-0000-0000-0000-000000000000', '5200', 'Inventory Shrinkage', 'EXPENSE', 0.00, true)
ON CONFLICT (tenant_id, code) DO NOTHING;
