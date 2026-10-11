INSERT INTO units_of_measure (id, tenant_id, name, symbol, conversion_factor, category)
VALUES
  (gen_random_uuid(), NULL, 'Cup', 'c', 250.0, 'Volume'),
  (gen_random_uuid(), NULL, 'Tablespoon', 'tbsp', 15.0, 'Volume'),
  (gen_random_uuid(), NULL, 'Teaspoon', 'tsp', 5.0, 'Volume')
ON CONFLICT DO NOTHING;
