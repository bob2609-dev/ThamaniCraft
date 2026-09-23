ALTER TABLE goods_receipt_lines
    ADD COLUMN received_uom_id UUID REFERENCES units_of_measure(id);

-- Receipts created before unit selection was introduced used the material's purchase UOM.
UPDATE goods_receipt_lines grl
SET received_uom_id = rm.purchase_uom_id
FROM raw_materials rm
WHERE rm.id = grl.raw_material_id
  AND grl.received_uom_id IS NULL;

ALTER TABLE goods_receipt_lines
    ALTER COLUMN received_uom_id SET NOT NULL;
