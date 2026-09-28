#!/bin/bash

# ThamaniCraft Data Clearing Script
# Clears operational data from inventory, recipes, production, and sales schemas.
# Leaves configuration data (UOMs, categories, users, roles) intact.

echo "Clearing data from inventory, recipes, production, and sales..."

docker exec -i thamanicraft-postgres psql -U postgres -d thamanicraft_db <<EOF
BEGIN;

-- Sales
TRUNCATE TABLE 
    sales.customers, 
    sales.orders, 
    sales.order_items, 
    sales.order_history, 
    sales.order_payments, 
    sales.payment_reversals, 
    sales.order_recipe_mappings 
CASCADE;

-- Production
TRUNCATE TABLE 
    public.production_batches, 
    public.production_batch_ingredients, 
    public.production_batch_history,
    public.production_inbox,
    public.production_outbox
CASCADE;

-- Recipes
TRUNCATE TABLE 
    public.recipes, 
    public.recipe_items 
CASCADE;

-- Inventory (excluding configuration/lookups like units_of_measure, item_categories)
TRUNCATE TABLE 
    public.raw_materials, 
    public.finished_products, 
    public.goods_receipts, 
    public.goods_receipt_lines, 
    public.inventory_adjustments, 
    public.material_cost_corrections,
    public.inventory_inbox,
    public.inventory_outbox
CASCADE;

COMMIT;
EOF

echo "Database operational data cleared successfully."
