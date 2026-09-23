INSERT INTO permissions(name,description,domain_group) VALUES
 ('RECORD_PAYMENTS','Record actual customer order payments','SALES'),
 ('REVERSE_PAYMENTS','Correct erroneous payment records with an audited reversal','SALES')
ON CONFLICT(name) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.name='OWNER' AND p.name IN ('RECORD_PAYMENTS','REVERSE_PAYMENTS')
ON CONFLICT DO NOTHING;
