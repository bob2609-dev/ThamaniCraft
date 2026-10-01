INSERT INTO units_of_measure (id, tenant_id, name, symbol, conversion_factor, category)
VALUES
  (gen_random_uuid(), NULL, 'Fluid Ounce', 'fl oz', 29.5735, 'Volume'),
  (gen_random_uuid(), NULL, 'Gallon', 'gal', 3785.41, 'Volume'),
  (gen_random_uuid(), NULL, 'Quart', 'qt', 946.353, 'Volume'),
  (gen_random_uuid(), NULL, 'Pint', 'pt', 473.176, 'Volume'),
  (gen_random_uuid(), NULL, 'Microgram', 'mcg', 0.000001, 'Weight'),
  (gen_random_uuid(), NULL, 'Packet', 'pkt', 1.0, 'Count'),
  (gen_random_uuid(), NULL, 'Box', 'box', 1.0, 'Count'),
  (gen_random_uuid(), NULL, 'Sack / Bag', 'bag', 1.0, 'Count')
ON CONFLICT DO NOTHING;
