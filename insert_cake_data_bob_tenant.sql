BEGIN;

-- Insert Categories
INSERT INTO item_categories (id, tenant_id, name, description) VALUES
('b1000000-0000-0000-0000-000000000001', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'Dry Ingredient', 'Dry baking ingredients'),
('b1000000-0000-0000-0000-000000000002', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'Liquid Ingredient', 'Liquid baking ingredients'),
('b1000000-0000-0000-0000-000000000003', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'Packaging', 'Boxes, boards, etc.'),
('b1000000-0000-0000-0000-000000000004', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'Decoration', 'Sprinkles, toppers, etc.')
ON CONFLICT (id) DO NOTHING;

-- Insert Raw Materials
INSERT INTO raw_materials (id, tenant_id, sku, name, category, category_id, base_uom_id, purchase_uom_id, current_stock_base_qty, cost_per_base_unit, reorder_level_base_qty) VALUES
('b2000000-0000-0000-0000-000000000001', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'RM-FLOUR', 'Cake Flour', 'Dry Ingredient', 'b1000000-0000-0000-0000-000000000001', '980d5a08-7cc6-4bac-a306-c11bcb92369e', '314365f6-ae80-4984-93a6-15ca92f2e17e', 10000, 2.5, 5000),
('b2000000-0000-0000-0000-000000000002', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'RM-SUGAR', 'White Sugar', 'Dry Ingredient', 'b1000000-0000-0000-0000-000000000001', '980d5a08-7cc6-4bac-a306-c11bcb92369e', '314365f6-ae80-4984-93a6-15ca92f2e17e', 15000, 3.0, 5000),
('b2000000-0000-0000-0000-000000000003', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'RM-MILK', 'Whole Milk', 'Liquid Ingredient', 'b1000000-0000-0000-0000-000000000002', 'ebb511b2-2435-428c-8571-852d2e4f3839', '00c3bda7-c62a-4741-b58a-257205616c41', 5000, 2.0, 2000),
('b2000000-0000-0000-0000-000000000004', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'RM-EGGS', 'Large Eggs', 'Dry Ingredient', 'b1000000-0000-0000-0000-000000000001', '6569f2ea-c2ef-456e-825b-1e10f44eceb0', '71e0a42a-8141-4dcd-93b8-93419740b6c1', 120, 350.0, 30),
('b2000000-0000-0000-0000-000000000005', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'RM-BUTTER', 'Unsalted Butter', 'Dry Ingredient', 'b1000000-0000-0000-0000-000000000001', '980d5a08-7cc6-4bac-a306-c11bcb92369e', '314365f6-ae80-4984-93a6-15ca92f2e17e', 5000, 15.0, 2000),
('b2000000-0000-0000-0000-000000000006', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'RM-BOX-8', '8 inch Cake Box', 'Packaging', 'b1000000-0000-0000-0000-000000000003', '6569f2ea-c2ef-456e-825b-1e10f44eceb0', '6569f2ea-c2ef-456e-825b-1e10f44eceb0', 100, 1500.0, 20),
('b2000000-0000-0000-0000-000000000007', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'RM-SPRINKLES', 'Rainbow Sprinkles', 'Decoration', 'b1000000-0000-0000-0000-000000000004', '980d5a08-7cc6-4bac-a306-c11bcb92369e', '314365f6-ae80-4984-93a6-15ca92f2e17e', 2000, 20.0, 500)
ON CONFLICT (id) DO UPDATE SET cost_per_base_unit = EXCLUDED.cost_per_base_unit;

-- Insert Finished Products
INSERT INTO finished_products (id, tenant_id, sku, name, category, base_uom_id, current_stock_base_qty, cost_per_base_unit, selling_price) VALUES
('b3000000-0000-0000-0000-000000000001', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'FP-CHOC-CAKE', 'Chocolate Cake', 'Cakes', '6569f2ea-c2ef-456e-825b-1e10f44eceb0', 5, 15000.00, 45000.00),
('b3000000-0000-0000-0000-000000000002', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'FP-VAN-CAKE', 'Vanilla Cake', 'Cakes', '6569f2ea-c2ef-456e-825b-1e10f44eceb0', 3, 12000.00, 40000.00),
('b3000000-0000-0000-0000-000000000003', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'FP-STRW-CAKE', 'Strawberry Cake', 'Cakes', '6569f2ea-c2ef-456e-825b-1e10f44eceb0', 2, 13000.00, 42000.00)
ON CONFLICT (id) DO UPDATE SET cost_per_base_unit = EXCLUDED.cost_per_base_unit, selling_price = EXCLUDED.selling_price;

-- Clean existing recipe items for these recipes just in case
DELETE FROM recipe_items WHERE recipe_id IN ('b4000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000002', 'b4000000-0000-0000-0000-000000000003');

-- Insert Recipes
INSERT INTO recipes (id, tenant_id, name, description, yield_quantity, yield_uom_id, labor_cost_per_batch, energy_cost_per_batch, additional_overhead_per_batch, finished_product_id, suggested_price) VALUES
('b4000000-0000-0000-0000-000000000001', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'Chocolate Cake Recipe', 'Standard chocolate cake', 1.00, '6569f2ea-c2ef-456e-825b-1e10f44eceb0', 5000.00, 2000.00, 1000.00, 'b3000000-0000-0000-0000-000000000001', 45000.00),
('b4000000-0000-0000-0000-000000000002', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'Vanilla Cake Recipe', 'Standard vanilla cake', 1.00, '6569f2ea-c2ef-456e-825b-1e10f44eceb0', 4000.00, 2000.00, 1000.00, 'b3000000-0000-0000-0000-000000000002', 40000.00),
('b4000000-0000-0000-0000-000000000003', 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'Strawberry Cake Recipe', 'Standard strawberry cake', 1.00, '6569f2ea-c2ef-456e-825b-1e10f44eceb0', 4500.00, 2000.00, 1000.00, 'b3000000-0000-0000-0000-000000000003', 42000.00)
ON CONFLICT (id) DO UPDATE SET labor_cost_per_batch = EXCLUDED.labor_cost_per_batch, energy_cost_per_batch = EXCLUDED.energy_cost_per_batch, additional_overhead_per_batch = EXCLUDED.additional_overhead_per_batch, suggested_price = EXCLUDED.suggested_price;

-- Insert Recipe Items
INSERT INTO recipe_items (id, tenant_id, recipe_id, raw_material_id, quantity_required, uom_id) VALUES
-- Choc Cake
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 500, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 300, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000003', 200, 'ebb511b2-2435-428c-8571-852d2e4f3839'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000004', 3, '6569f2ea-c2ef-456e-825b-1e10f44eceb0'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000005', 150, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000006', 1, '6569f2ea-c2ef-456e-825b-1e10f44eceb0'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000007', 50, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),

-- Vanilla Cake
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 500, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 250, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000003', 250, 'ebb511b2-2435-428c-8571-852d2e4f3839'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000004', 3, '6569f2ea-c2ef-456e-825b-1e10f44eceb0'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000005', 150, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000006', 1, '6569f2ea-c2ef-456e-825b-1e10f44eceb0'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000007', 20, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),

-- Strawberry Cake
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000001', 450, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000002', 350, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 200, 'ebb511b2-2435-428c-8571-852d2e4f3839'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000004', 4, '6569f2ea-c2ef-456e-825b-1e10f44eceb0'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000005', 100, '980d5a08-7cc6-4bac-a306-c11bcb92369e'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000006', 1, '6569f2ea-c2ef-456e-825b-1e10f44eceb0'),
(gen_random_uuid(), 'abc1d324-4e55-44b6-ba2c-232e0d40116a', 'b4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000007', 30, '980d5a08-7cc6-4bac-a306-c11bcb92369e');

COMMIT;
