CREATE TABLE IF NOT EXISTS platform_configurations (
    config_key VARCHAR(128) PRIMARY KEY,
    config_value TEXT,
    description TEXT,
    data_type VARCHAR(32) DEFAULT 'STRING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO platform_configurations (config_key, config_value, description, data_type) VALUES
('platform_name', 'ThamaniCraft', 'The global name of the platform', 'STRING'),
('default_currency', 'TZS', 'The default currency for the platform', 'STRING'),
('default_timezone', 'Africa/Dar_es_Salaam', 'The default timezone for the platform', 'STRING'),
('global_tax_rate', '18.0', 'The standard global tax rate (VAT) percentage', 'NUMBER');
