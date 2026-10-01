ALTER TABLE units_of_measure ALTER COLUMN tenant_id DROP NOT NULL;
UPDATE units_of_measure SET tenant_id = NULL WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
