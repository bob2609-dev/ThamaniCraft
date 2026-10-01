const fs = require('fs');

const requestsFile = '/home/bob2609/Projects/ThamaniCraft/craft-sales-service/src/main/java/tz/co/thamanicraft/sales/SalesRequests.java';
let req = fs.readFileSync(requestsFile, 'utf8');
req = req.replace(
    /@Size\(max=255\) String finishedProductName\) \{\}/,
    '@Size(max=255) String finishedProductName,\n        UUID recipeId,\n        @DecimalMin("0.0001") @Digits(integer=8,fraction=4) BigDecimal outputPerItem) {}'
);
fs.writeFileSync(requestsFile, req);

const serviceFile = '/home/bob2609/Projects/ThamaniCraft/craft-sales-service/src/main/java/tz/co/thamanicraft/sales/SalesService.java';
let svc = fs.readFileSync(serviceFile, 'utf8');

const insertItemsTarget = `            jdbc.update("""
                INSERT INTO sales.order_items(id,order_id,position,description,quantity,unit,unit_price,line_total,instructions,finished_product_id,finished_product_name,unit_cost)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                """,UUID.randomUUID(),id,position++,item.description().trim(),item.quantity(),item.unit().trim(),item.unitPrice(),OrderTotals.line(item),item.instructions(),item.finishedProductId(),item.finishedProductName(),unitCost);
        }`;
        
const insertItemsReplacement = `            UUID itemId = UUID.randomUUID();
            jdbc.update("""
                INSERT INTO sales.order_items(id,order_id,position,description,quantity,unit,unit_price,line_total,instructions,finished_product_id,finished_product_name,unit_cost)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                """,itemId,id,position++,item.description().trim(),item.quantity(),item.unit().trim(),item.unitPrice(),OrderTotals.line(item),item.instructions(),item.finishedProductId(),item.finishedProductName(),unitCost);
            
            if (item.recipeId() != null && item.outputPerItem() != null) {
                var recipeRows = jdbc.queryForList("SELECT name, yield_uom_id, yield_unit, yield_quantity, (SELECT batch_cost FROM public.production_recipe_costing WHERE recipe_id = recipes.id) as batch_cost FROM public.recipes WHERE tenant_id=? AND id=?", tenant(), item.recipeId());
                if (!recipeRows.isEmpty()) {
                    var r = recipeRows.get(0);
                    BigDecimal yieldQty = (BigDecimal) r.get("yield_quantity");
                    BigDecimal batchCost = (BigDecimal) r.get("batch_cost");
                    if (yieldQty != null && yieldQty.signum() > 0 && batchCost != null) {
                        BigDecimal plannedOutput = item.quantity().multiply(item.outputPerItem()).setScale(4, RoundingMode.HALF_UP);
                        BigDecimal standardCost = batchCost.multiply(plannedOutput).divide(yieldQty, 4, RoundingMode.HALF_UP);
                        jdbc.update("""
                            INSERT INTO sales.order_recipe_mappings(order_item_id,recipe_id,recipe_name,output_uom_id,output_unit,
                            output_per_item,planned_output,standard_cost,mapped_by) VALUES (?,?,?,?,?,?,?,?,?)
                            """, itemId, item.recipeId(), r.get("name"), r.get("yield_uom_id"), r.get("yield_unit"),
                            item.outputPerItem(), plannedOutput, standardCost, TenantContext.getCurrentUserId());
                    }
                }
            }
        }`;
svc = svc.replace(insertItemsTarget, insertItemsReplacement);
fs.writeFileSync(serviceFile, svc);
console.log('done');
