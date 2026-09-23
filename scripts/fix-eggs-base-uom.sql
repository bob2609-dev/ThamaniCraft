-- One-off correction for the verified development Eggs record.
-- Aborts if new recipes/adjustments exist; rerunning does not reconvert quantities.
BEGIN;
LOCK TABLE raw_materials, goods_receipt_lines, recipe_items, inventory_adjustments IN SHARE ROW EXCLUSIVE MODE;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM raw_materials
      WHERE id='f6d14a7c-5d64-4d5f-8505-b277e8acc7e7'
        AND tenant_id='00000000-0000-0000-0000-000000000000'
        AND sku='EG-1' AND base_uom_id='4b5642e6-f95c-4158-abc7-3f20cb89b772') THEN
    RAISE EXCEPTION 'Eggs no longer has the expected tray base unit; nothing changed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM units_of_measure
      WHERE id='4b5642e6-f95c-4158-abc7-3f20cb89b772'
        AND tenant_id='00000000-0000-0000-0000-000000000000'
        AND base_unit_id='eca3cb91-7fe6-44d4-a061-0247657b8d62' AND conversion_factor=30) THEN
    RAISE EXCEPTION 'Expected tray-to-piece conversion not found';
  END IF;
  IF EXISTS (SELECT 1 FROM recipe_items WHERE raw_material_id='f6d14a7c-5d64-4d5f-8505-b277e8acc7e7')
     OR EXISTS (SELECT 1 FROM inventory_adjustments WHERE raw_material_id='f6d14a7c-5d64-4d5f-8505-b277e8acc7e7') THEN
    RAISE EXCEPTION 'New linked records require review before conversion';
  END IF;
  UPDATE goods_receipt_lines SET base_quantity_received=base_quantity_received*30
    WHERE raw_material_id='f6d14a7c-5d64-4d5f-8505-b277e8acc7e7';
  UPDATE raw_materials SET
    base_uom_id='eca3cb91-7fe6-44d4-a061-0247657b8d62',
    current_stock_base_qty=current_stock_base_qty*30,
    reorder_level_base_qty=reorder_level_base_qty*30,
    cost_per_base_unit=ROUND(cost_per_base_unit/30,4), updated_at=CURRENT_TIMESTAMP
    WHERE id='f6d14a7c-5d64-4d5f-8505-b277e8acc7e7';
END $$;
COMMIT;
