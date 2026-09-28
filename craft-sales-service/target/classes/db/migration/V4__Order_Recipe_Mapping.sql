CREATE TABLE order_recipe_mappings (
 order_item_id UUID PRIMARY KEY REFERENCES order_items(id) ON DELETE CASCADE,
 recipe_id UUID NOT NULL,
 recipe_name VARCHAR(255) NOT NULL,
 output_uom_id UUID NOT NULL,
 output_unit VARCHAR(255) NOT NULL,
 output_per_item NUMERIC(12,4) NOT NULL CHECK(output_per_item>0),
 planned_output NUMERIC(12,4) NOT NULL CHECK(planned_output>0),
 standard_cost NUMERIC(20,4) NOT NULL CHECK(standard_cost>=0),
 mapped_by UUID NOT NULL,
 mapped_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
