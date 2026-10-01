-- Clear Test Data (Sales, Inventory, Production, Finance)
-- Preserves Identity (users, roles, permissions), configurations, and flyway history.

-- Sales Schema
TRUNCATE TABLE sales.payment_reversals CASCADE;
TRUNCATE TABLE sales.order_payments CASCADE;
TRUNCATE TABLE sales.order_recipe_mappings CASCADE;
TRUNCATE TABLE sales.order_history CASCADE;
TRUNCATE TABLE sales.order_items CASCADE;
TRUNCATE TABLE sales.orders CASCADE;
TRUNCATE TABLE sales.customers CASCADE;

-- Finance Schema
TRUNCATE TABLE finance.journal_lines CASCADE;
TRUNCATE TABLE finance.journal_entries CASCADE;
TRUNCATE TABLE finance.accounts CASCADE;
TRUNCATE TABLE finance.expenses CASCADE;
TRUNCATE TABLE finance.facility_leases CASCADE;
TRUNCATE TABLE finance.fixed_assets CASCADE;
TRUNCATE TABLE finance.overhead_settings CASCADE;

-- Public Schema (Inventory & Production)
TRUNCATE TABLE public.inventory_outbox CASCADE;
TRUNCATE TABLE public.inventory_inbox CASCADE;
TRUNCATE TABLE public.production_outbox CASCADE;
TRUNCATE TABLE public.production_inbox CASCADE;
TRUNCATE TABLE public.production_batch_history CASCADE;
TRUNCATE TABLE public.production_batch_ingredients CASCADE;
TRUNCATE TABLE public.production_batches CASCADE;
TRUNCATE TABLE public.recipe_items CASCADE;
TRUNCATE TABLE public.recipes CASCADE;
TRUNCATE TABLE public.goods_receipt_lines CASCADE;
TRUNCATE TABLE public.goods_receipts CASCADE;
TRUNCATE TABLE public.inventory_adjustments CASCADE;
TRUNCATE TABLE public.material_cost_corrections CASCADE;
TRUNCATE TABLE public.finished_products CASCADE;
TRUNCATE TABLE public.raw_materials CASCADE;
TRUNCATE TABLE public.item_categories CASCADE;
TRUNCATE TABLE public.units_of_measure CASCADE;

-- Reset Sequences if needed (TRUNCATE ... RESTART IDENTITY does this)
-- Let's use RESTART IDENTITY on all of them to be clean
TRUNCATE TABLE 
    sales.payment_reversals,
    sales.order_payments,
    sales.order_recipe_mappings,
    sales.order_history,
    sales.order_items,
    sales.orders,
    sales.customers,
    finance.journal_lines,
    finance.journal_entries,
    finance.accounts,
    finance.expenses,
    finance.facility_leases,
    finance.fixed_assets,
    finance.overhead_settings,
    public.inventory_outbox,
    public.inventory_inbox,
    public.production_outbox,
    public.production_inbox,
    public.production_batch_history,
    public.production_batch_ingredients,
    public.production_batches,
    public.recipe_items,
    public.recipes,
    public.goods_receipt_lines,
    public.goods_receipts,
    public.inventory_adjustments,
    public.material_cost_corrections,
    public.finished_products,
    public.raw_materials,
    public.item_categories,
    public.units_of_measure
RESTART IDENTITY CASCADE;
