INSERT INTO permissions(name,description,domain_group) VALUES
 ('VIEW_FINANCE','View asset register and overhead estimates','FINANCE'),
 ('MANAGE_FINANCE','Manage assets, leases and overhead allocation','FINANCE')
ON CONFLICT(name) DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.name='OWNER' AND p.name IN ('VIEW_FINANCE','MANAGE_FINANCE')
ON CONFLICT DO NOTHING;
