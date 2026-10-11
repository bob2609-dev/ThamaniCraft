CREATE TABLE platform_roles (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE platform_permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    domain_group VARCHAR(50)
);

CREATE TABLE platform_role_permissions (
    role_id BIGINT NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES platform_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role_id BIGINT REFERENCES platform_roles(id)
);

-- Seed Platform Permissions
INSERT INTO platform_permissions (name, description, domain_group) VALUES
('MANAGE_TENANTS', 'Create and manage tenants/subscribers', 'TENANTS'),
('MANAGE_BILLING', 'Manage billing and subscriptions', 'BILLING'),
('VIEW_SYSTEM_LOGS', 'View system-wide audit logs and metrics', 'MONITORING'),
('MANAGE_SYSTEM_CONFIG', 'Manage global system configurations', 'SETTINGS'),
('MANAGE_PLATFORM_ADMINS', 'Manage platform administrators and roles', 'SETTINGS');

-- Seed Master Admin Role
INSERT INTO platform_roles (name) VALUES ('SUPER_ADMIN');

-- Assign all permissions to SUPER_ADMIN
INSERT INTO platform_role_permissions (role_id, permission_id)
SELECT 1, id FROM platform_permissions;

-- Seed Default Platform Admin (password is 'password')
INSERT INTO platform_admins (email, password, name, is_active, role_id) VALUES
('superadmin@thamanicraft.co.tz', '$2b$12$9ObXHlDYYqenhtatgf469eTs4qqCMm/p6vMrU/Jkbm869eW8eQG7u', 'Super Administrator', TRUE, 1);

