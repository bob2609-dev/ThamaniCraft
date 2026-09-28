package tz.co.thamanicraft.sales;

import com.thamanicraft.security.context.TenantContext;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.*;
import java.util.*;

@Service
public class OrderRecipeMappingService {
    public record Request(@NotNull UUID recipeId,@NotNull @Min(0) Integer version,
        @NotNull @DecimalMin("0.0001") @Digits(integer=8,fraction=4) BigDecimal outputPerItem) {}
    private final JdbcTemplate jdbc;
    private final ProductionWorkOrderClient workOrderClient;
    public OrderRecipeMappingService(JdbcTemplate jdbc, ProductionWorkOrderClient workOrderClient) {this.jdbc=jdbc;this.workOrderClient=workOrderClient;}
    public static BigDecimal plannedOutput(BigDecimal quantity,BigDecimal factor) {
        BigDecimal output=quantity.multiply(factor).setScale(4,RoundingMode.HALF_UP);
        if(output.signum()<=0 || output.compareTo(new BigDecimal("99999999.9999"))>0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Production quantity is outside supported limits");
        return output;
    }
    @Transactional
    public void save(UUID order,UUID item,Request request,ProductionRecipeClient.Recipe recipe) {
        UUID tenant=TenantContext.getCurrentTenant();
        if(tenant==null) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Tenant required");
        if(!request.recipeId().equals(recipe.id()) || recipe.yieldQuantity()==null || recipe.yieldQuantity().signum()<=0
            || recipe.yieldUomId()==null || recipe.costing()==null || recipe.costing().batchCost()==null)
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Invalid recipe output information");
        var orders=jdbc.queryForList("SELECT version,status FROM sales.orders WHERE tenant_id=? AND id=? FOR UPDATE",tenant,order);
        if(orders.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found");
        var header=orders.get(0);
        if(((Number)header.get("version")).intValue()!=request.version() || !Set.of("NEW","CONFIRMED").contains(header.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Order changed or cannot be mapped. Reload and retry.");
        var items=jdbc.queryForList("SELECT quantity FROM sales.order_items WHERE order_id=? AND id=?",order,item);
        if(items.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Order item not found");
        BigDecimal output=plannedOutput((BigDecimal)items.get(0).get("quantity"),request.outputPerItem());
        BigDecimal cost=recipe.costing().batchCost().multiply(output).divide(recipe.yieldQuantity(),4,RoundingMode.HALF_UP);
        if(cost.signum()<0 || cost.precision()-cost.scale()>16)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Recipe cost is outside supported limits");
        jdbc.update("""
            INSERT INTO sales.order_recipe_mappings(order_item_id,recipe_id,recipe_name,output_uom_id,output_unit,
            output_per_item,planned_output,standard_cost,mapped_by) VALUES (?,?,?,?,?,?,?,?,?)
            ON CONFLICT(order_item_id) DO UPDATE SET recipe_id=EXCLUDED.recipe_id,recipe_name=EXCLUDED.recipe_name,
            output_uom_id=EXCLUDED.output_uom_id,output_unit=EXCLUDED.output_unit,output_per_item=EXCLUDED.output_per_item,
            planned_output=EXCLUDED.planned_output,standard_cost=EXCLUDED.standard_cost,mapped_by=EXCLUDED.mapped_by,mapped_at=CURRENT_TIMESTAMP
            """,item,recipe.id(),recipe.name(),recipe.yieldUomId(),recipe.yieldUnit(),request.outputPerItem(),output,cost,TenantContext.getCurrentUserId());
        jdbc.update("UPDATE sales.orders SET version=version+1,updated_at=CURRENT_TIMESTAMP WHERE tenant_id=? AND id=?",tenant,order);
    }
    
    @Transactional
    public void generateWorkOrder(UUID orderId, UUID itemId, int version, String authorization) {
        UUID tenant=TenantContext.getCurrentTenant();
        if(tenant==null) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Tenant required");
        
        var orders=jdbc.queryForList("SELECT version,status,order_number FROM sales.orders WHERE tenant_id=? AND id=? FOR UPDATE",tenant,orderId);
        if(orders.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found");
        var header=orders.get(0);
        if(((Number)header.get("version")).intValue()!=version || !Set.of("CONFIRMED").contains(header.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Work orders can only be generated for CONFIRMED orders. Reload and retry.");
            
        var items=jdbc.queryForList("""
            SELECT i.description as product_name, m.recipe_id, m.planned_output, i.work_order_id 
            FROM sales.order_items i 
            JOIN sales.order_recipe_mappings m ON m.order_item_id = i.id 
            WHERE i.order_id=? AND i.id=?
            """,orderId,itemId);
        if(items.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Mapped order item not found");
        var item = items.get(0);
        
        if (item.get("work_order_id") != null) throw new ResponseStatusException(HttpStatus.CONFLICT,"Work order already generated");
        
        String generationKey = tenant.toString() + ":" + itemId.toString();
        String reference = "Order " + header.get("order_number") + " - " + item.get("product_name");
        
        var request = new ProductionWorkOrderClient.GenerateRequest((UUID)item.get("recipe_id"), (BigDecimal)item.get("planned_output"), orderId, itemId, generationKey, reference);
        UUID workOrderId = workOrderClient.generate(request, authorization);
        
        jdbc.update("UPDATE sales.order_items SET work_order_id=?, work_order_status='DRAFT' WHERE order_id=? AND id=?", workOrderId, orderId, itemId);
        jdbc.update("UPDATE sales.orders SET version=version+1,updated_at=CURRENT_TIMESTAMP WHERE tenant_id=? AND id=?",tenant,orderId);
    }
}
