CREATE UNIQUE INDEX uq_raw_materials_tenant_sku_ci
    ON raw_materials (tenant_id, LOWER(sku))
    WHERE sku IS NOT NULL;
