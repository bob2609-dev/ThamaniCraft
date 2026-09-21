-- ThamaniCraft Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Units of Measure standard seed table
CREATE TABLE IF NOT EXISTS initial_system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(64) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO initial_system_configs (config_key, config_value) 
VALUES ('SYSTEM_STATUS', 'INITIALIZED')
ON CONFLICT (config_key) DO NOTHING;\n