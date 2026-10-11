INSERT INTO units_of_measure (id, tenant_id, name, symbol, conversion_factor, category)
VALUES
  (gen_random_uuid(), NULL, 'Tray of 30', 'tray30', 30.0, 'Count'),
  (gen_random_uuid(), NULL, 'Bucket', 'bkt', 1.0, 'Volume')
ON CONFLICT DO NOTHING;
