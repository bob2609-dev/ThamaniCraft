CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    name VARCHAR(100) NOT NULL,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    domain_group VARCHAR(50)
);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role_id BIGINT REFERENCES roles(id)
);

-- Seed System Permissions
INSERT INTO permissions (name, description, domain_group) VALUES
('VIEW_DASHBOARD', 'View the main dashboard', 'GENERAL'),
('VIEW_INVENTORY', 'View inventory list', 'INVENTORY'),
('ADJUST_INVENTORY', 'Adjust inventory levels', 'INVENTORY'),
('VIEW_RECIPES', 'View recipes and BOMs', 'PRODUCTION'),
('CREATE_RECIPES', 'Create and edit recipes', 'PRODUCTION'),
('VIEW_PRODUCTION', 'View production batches', 'PRODUCTION'),
('EXECUTE_PRODUCTION', 'Start and complete batches', 'PRODUCTION'),
('VIEW_SALES', 'View sales and dispatch', 'SALES'),
('PROCESS_SALES', 'Process new sales orders', 'SALES'),
('VIEW_REPORTS', 'View financial and audit reports', 'REPORTS'),
('MANAGE_USERS', 'Manage users and roles', 'SETTINGS');

-- Seed System Tenant (00000000-0000-0000-0000-000000000000) and Owner Role
INSERT INTO roles (tenant_id, name, is_system_role) VALUES
('00000000-0000-0000-0000-000000000000', 'OWNER', TRUE);

-- Map all permissions to OWNER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Seed Admin User (password is 'password' -> bcrypt hash)
INSERT INTO users (tenant_id, email, password, name, is_active, role_id) VALUES
('00000000-0000-0000-0000-000000000000', 'admin@thamanicraft.co.tz', '$2b$12$9ObXHlDYYqenhtatgf469eTs4qqCMm/p6vMrU/Jkbm869eW8eQG7u', 'System Admin', TRUE, 1);
