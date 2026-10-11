INSERT INTO units_of_measure (id, tenant_id, name, symbol, conversion_factor, category)
VALUES
  (gen_random_uuid(), NULL, 'Kilogram', 'kg', 1000.0, 'Weight'),
  (gen_random_uuid(), NULL, 'Gram', 'g', 1.0, 'Weight'),
  (gen_random_uuid(), NULL, 'Milligram', 'mg', 0.001, 'Weight'),
  (gen_random_uuid(), NULL, 'Pound', 'lb', 453.592, 'Weight'),
  (gen_random_uuid(), NULL, 'Ounce', 'oz', 28.3495, 'Weight'),
  (gen_random_uuid(), NULL, 'Litre', 'l', 1000.0, 'Volume'),
  (gen_random_uuid(), NULL, 'Millilitre', 'ml', 1.0, 'Volume'),
  (gen_random_uuid(), NULL, 'Piece', 'pc', 1.0, 'Count'),
  (gen_random_uuid(), NULL, 'Dozen', 'dz', 12.0, 'Count')
ON CONFLICT DO NOTHING;
