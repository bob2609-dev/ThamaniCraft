-- Assign base units for Weight category
UPDATE units_of_measure 
SET base_unit_id = (SELECT id FROM units_of_measure WHERE name = 'Gram' AND category = 'Weight' LIMIT 1)
WHERE category = 'Weight' AND name != 'Gram';

-- Assign base units for Volume category
UPDATE units_of_measure 
SET base_unit_id = (SELECT id FROM units_of_measure WHERE name = 'Millilitre' AND category = 'Volume' LIMIT 1)
WHERE category = 'Volume' AND name != 'Millilitre';

-- Assign base units for Count category
UPDATE units_of_measure 
SET base_unit_id = (SELECT id FROM units_of_measure WHERE name = 'Piece' AND category = 'Count' LIMIT 1)
WHERE category = 'Count' AND name != 'Piece';

-- For the base units themselves, they can point to themselves or remain NULL.
-- In many ERP systems, the base unit points to itself for clarity, so let's do that.
UPDATE units_of_measure 
SET base_unit_id = id 
WHERE name IN ('Gram', 'Millilitre', 'Piece') AND base_unit_id IS NULL;
