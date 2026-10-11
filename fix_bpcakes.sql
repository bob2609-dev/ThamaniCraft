DO $$
DECLARE
    new_tenant_id UUID := gen_random_uuid();
    sys_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
    new_role_id BIGINT;
BEGIN
    INSERT INTO tenants (id, name, display_name) VALUES (new_tenant_id, 'bpcakes', 'BP Cakes');

    INSERT INTO roles (tenant_id, name, is_system_role) VALUES (new_tenant_id, 'OWNER', true) RETURNING id INTO new_role_id;
    
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT new_role_id, id FROM permissions;

    UPDATE users SET tenant_id = new_tenant_id, role_id = new_role_id WHERE email = 'info@bpcakes.co.tz';
END $$;
