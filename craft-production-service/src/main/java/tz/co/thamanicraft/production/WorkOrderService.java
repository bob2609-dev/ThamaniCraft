package tz.co.thamanicraft.production;

import com.thamanicraft.security.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import jakarta.validation.constraints.*;

@Service
@RequiredArgsConstructor
public class WorkOrderService {
    public record GenerateRequest(@NotNull UUID recipeId, @NotNull @DecimalMin("0.0001") BigDecimal plannedYield,
        @NotNull UUID orderId, @NotNull UUID orderItemId, @NotBlank String generationKey, String reference) {}
    private final JdbcTemplate jdbc;
    private UUID tenant() {
        UUID tenant = TenantContext.getCurrentTenant();
        if (tenant == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Tenant context required");
        return tenant;
    }
    public List<Map<String,Object>> recipes() {
        return jdbc.queryForList("""
            SELECT r.id,r.name,r.yield_quantity AS "yieldQuantity",u.symbol AS "outputUnit"
            FROM recipes r JOIN units_of_measure u ON u.id=r.yield_uom_id AND u.tenant_id=r.tenant_id
            WHERE r.tenant_id=? AND r.is_active=true ORDER BY r.name
            """,tenant());
    }
    public List<Map<String,Object>> list() {
        return jdbc.queryForList("""
            SELECT id,reference,recipe_name AS "recipeName",status,planned_yield AS "plannedYield",
                output_unit AS "outputUnit",scheduled_date AS "scheduledDate",planned_cost AS "plannedCost",version
            FROM production_batches WHERE tenant_id=? ORDER BY created_at DESC,id
            """,tenant());
    }
    private Map<String,Object> header(UUID id, boolean lock) {
        var rows = jdbc.queryForList("""
            SELECT id,recipe_id AS "recipeId",recipe_name AS "recipeName",status,reference,notes,
                planned_yield AS "plannedYield",scheduled_date AS "scheduledDate",output_unit AS "outputUnit",
                planned_labor AS "plannedLabor",planned_energy AS "plannedEnergy",
                planned_overhead AS "plannedOverhead",planned_cost AS "plannedCost",version
            FROM production_batches WHERE tenant_id=? AND id=?
            """ + (lock ? " FOR UPDATE" : ""),tenant(),id);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Work order not found");
        return rows.get(0);
    }
    @Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
    public Map<String,Object> detail(UUID id) {
        var row = header(id,false);
        row.put("ingredients",ingredients(id));
        row.put("history",jdbc.queryForList("""
            SELECT id,action,actor_id AS "actorId",recorded_at AS "recordedAt"
            FROM production_batch_history WHERE tenant_id=? AND batch_id=? ORDER BY recorded_at,id
            """,tenant(),id));
        return row;
    }
    private List<Map<String,Object>> ingredients(UUID id) {
        return jdbc.queryForList("""
            SELECT i.raw_material_id AS "materialId",i.material_name AS name,i.unit,
                i.planned_quantity AS quantity,i.actual_quantity AS "actualQuantity",i.unit_cost AS "unitCost",i.line_cost AS "lineCost",i.instructions,
                m.current_stock_base_qty AS available,
                (m.id IS NOT NULL AND m.base_uom_id=i.base_uom_id) AS compatible
            FROM production_batch_ingredients i
            LEFT JOIN raw_materials m ON m.id=i.raw_material_id AND m.tenant_id=i.tenant_id
            WHERE i.tenant_id=? AND i.batch_id=? ORDER BY i.material_name,i.raw_material_id
            """,tenant(),id);
    }
    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public UUID save(UUID id,WorkOrderRequest request) {
        if (id == null) {
            if (request.version()!=0) conflict("A new work order must have version 0");
            id = UUID.randomUUID();
            // Tenant validation happens before inserting the recipe relationship.
            recipe(request.recipeId());
            jdbc.update("""
                INSERT INTO production_batches(id,tenant_id,recipe_id,planned_yield,reference,notes,scheduled_date,created_by)
                VALUES (?,?,?,?,?,?,?,?)
                """,id,tenant(),request.recipeId(),request.plannedYield(),request.reference(),request.notes(),
                request.scheduledDate(),TenantContext.getCurrentUserId());
            audit(id,"CREATED");
        } else {
            var current = header(id,true);
            checkVersion(current,request.version());
            if (!"DRAFT".equals(current.get("status"))) conflict("Only drafts can be edited");
            recipe(request.recipeId());
            jdbc.update("""
                UPDATE production_batches SET recipe_id=?,planned_yield=?,reference=?,notes=?,scheduled_date=?,
                    version=version+1,updated_at=CURRENT_TIMESTAMP WHERE tenant_id=? AND id=?
                """,request.recipeId(),request.plannedYield(),request.reference(),request.notes(),request.scheduledDate(),tenant(),id);
            audit(id,"EDITED");
        }
        snapshot(id,request.recipeId(),request.plannedYield());
        return id;
    }
    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public UUID generate(GenerateRequest request) {
        var existing = jdbc.queryForList("SELECT id FROM production_batches WHERE tenant_id=? AND generation_key=?",tenant(),request.generationKey());
        if (!existing.isEmpty()) return (UUID) existing.get(0).get("id");
        UUID id = UUID.randomUUID();
        recipe(request.recipeId());
        jdbc.update("""
            INSERT INTO production_batches(id,tenant_id,recipe_id,planned_yield,reference,order_id,order_item_id,generation_key,created_by)
            VALUES (?,?,?,?,?,?,?,?,?)
            """,id,tenant(),request.recipeId(),request.plannedYield(),request.reference(),request.orderId(),request.orderItemId(),request.generationKey(),TenantContext.getCurrentUserId());
        audit(id,"CREATED");
        snapshot(id,request.recipeId(),request.plannedYield());
        return id;
    }
    private Map<String,Object> recipe(UUID id) {
        var rows = jdbc.queryForList("""
            SELECT r.name,r.yield_quantity AS yield,r.yield_uom_id AS unit,u.symbol,
                r.labor_cost_per_batch AS labor,r.energy_cost_per_batch AS energy,r.additional_overhead_per_batch AS overhead
            FROM recipes r JOIN units_of_measure u ON u.id=r.yield_uom_id AND u.tenant_id=r.tenant_id
            WHERE r.tenant_id=? AND r.id=? AND r.is_active=true
            """,tenant(),id);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Active recipe not found");
        return rows.get(0);
    }
    private void snapshot(UUID batch,UUID recipeId,BigDecimal planned) {
        var r = recipe(recipeId);
        BigDecimal yield = (BigDecimal) r.get("yield");
        var lines = jdbc.queryForList("""
            SELECT i.raw_material_id AS material,i.quantity_required AS quantity,i.waste_factor AS waste,i.instructions,
                m.name,m.base_uom_id AS unit,u.symbol,m.cost_per_base_unit AS cost
            FROM recipe_items i
            LEFT JOIN raw_materials m ON m.id=i.raw_material_id AND m.tenant_id=i.tenant_id
            LEFT JOIN units_of_measure u ON u.id=m.base_uom_id AND u.tenant_id=m.tenant_id
            WHERE i.tenant_id=? AND i.recipe_id=? ORDER BY i.raw_material_id
            """,tenant(),recipeId);
        if (lines.isEmpty()) conflict("The recipe needs at least one ingredient");
        BigDecimal labor = WorkOrderMath.scale((BigDecimal)r.get("labor"),planned,yield);
        BigDecimal energy = WorkOrderMath.scale((BigDecimal)r.get("energy"),planned,yield);
        BigDecimal overhead = WorkOrderMath.scale((BigDecimal)r.get("overhead"),planned,yield);
        BigDecimal total = labor.add(energy).add(overhead);
        jdbc.update("DELETE FROM production_batch_ingredients WHERE tenant_id=? AND batch_id=?",tenant(),batch);
        for (var line : lines) {
            if (line.get("name")==null || line.get("symbol")==null) conflict("A recipe ingredient or its unit is unavailable");
            BigDecimal qty = WorkOrderMath.quantity((BigDecimal)line.get("quantity"),(BigDecimal)line.get("waste"),planned,yield);
            BigDecimal cost = qty.multiply((BigDecimal)line.get("cost")).setScale(4,RoundingMode.HALF_UP);
            total = total.add(cost);
            jdbc.update("""
                INSERT INTO production_batch_ingredients(id,tenant_id,batch_id,raw_material_id,material_name,base_uom_id,
                    unit,planned_quantity,unit_cost,line_cost,instructions) VALUES (?,?,?,?,?,?,?,?,?,?,?)
                """,UUID.randomUUID(),tenant(),batch,line.get("material"),line.get("name"),line.get("unit"),
                line.get("symbol"),qty,line.get("cost"),cost,line.get("instructions"));
        }
        jdbc.update("""
            UPDATE production_batches SET recipe_name=?,output_uom_id=?,output_unit=?,planned_labor=?,
                planned_energy=?,planned_overhead=?,planned_cost=? WHERE tenant_id=? AND id=?
            """,r.get("name"),r.get("unit"),r.get("symbol"),labor,energy,overhead,total,tenant(),batch);
    }
    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public void transition(UUID id,String action,int version) {
        var current = header(id,true);
        checkVersion(current,version);
        String status = (String) current.get("status"), next;
        switch (action) {
            case "schedule" -> {
                if (!status.equals("DRAFT")) conflict("Only a draft can be scheduled");
                if (current.get("scheduledDate")==null) conflict("Set a schedule date before scheduling");
                snapshot(id,(UUID)current.get("recipeId"),(BigDecimal)current.get("plannedYield"));
                next = "SCHEDULED";
            }
            case "start" -> {
                if (!status.equals("SCHEDULED")) conflict("Only a scheduled work order can start");
                var required = ingredients(id);
                if (required.isEmpty()) conflict("This work order has no ingredient snapshot");
                for (var line : required) {
                    if (!Boolean.TRUE.equals(line.get("compatible")) || line.get("available")==null
                            || ((BigDecimal)line.get("available")).compareTo((BigDecimal)line.get("quantity"))<0)
                        conflict("Insufficient or incompatible stock for "+line.get("name"));
                }
                next = "IN_PROGRESS";
            }
            case "cancel" -> {
                if (!Set.of("DRAFT","SCHEDULED").contains(status)) conflict("Only unstarted work orders can be cancelled");
                next = "CANCELLED";
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown work order action");
        }
        jdbc.update("""
            UPDATE production_batches SET status=?,version=version+1,updated_at=CURRENT_TIMESTAMP,
                started_at=CASE WHEN ?='IN_PROGRESS' THEN CURRENT_TIMESTAMP ELSE started_at END
            WHERE tenant_id=? AND id=?
            """,next,next,tenant(),id);
        audit(id,next);
    }
    
    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public void complete(UUID id, WorkOrderRequest.Completion request) {
        var current = header(id, true);
        checkVersion(current, request.version());
        if (!"IN_PROGRESS".equals(current.get("status")) && !"COMPLETION_FAILED".equals(current.get("status"))) {
            conflict("Only an in-progress or failed work order can be completed");
        }
        var required = ingredients(id);
        if (required.isEmpty()) conflict("This work order has no ingredient snapshot");
        if (request.ingredients() == null || request.ingredients().isEmpty()) {
            conflict("All ingredients must have actual quantities reported");
        }
        for (var act : request.ingredients()) {
            int updated = jdbc.update("UPDATE production_batch_ingredients SET actual_quantity=? WHERE tenant_id=? AND batch_id=? AND raw_material_id=?", 
               act.actualQuantity(), tenant(), id, act.materialId());
            if (updated == 0) conflict("Ingredient " + act.materialId() + " is not part of this batch");
        }
        jdbc.update("UPDATE production_batches SET status='COMPLETION_PENDING', actual_yield=?, scrap_count=?, version=version+1, updated_at=CURRENT_TIMESTAMP, completed_at=CURRENT_TIMESTAMP WHERE tenant_id=? AND id=?", 
            request.actualYield(), request.scrapCount(), tenant(), id);
        audit(id, "COMPLETION_PENDING");
        
        var recipe = jdbc.queryForList("SELECT finished_product_id FROM recipes WHERE id=? AND tenant_id=?", current.get("recipeId"), tenant());
        UUID finishedProductId = recipe.isEmpty() ? null : (UUID) recipe.get(0).get("finished_product_id");
        
        try {
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var payload = new java.util.HashMap<String, Object>();
            payload.put("tenantId", tenant());
            payload.put("batchId", id);
            payload.put("finishedProductId", finishedProductId);
            payload.put("actualYield", request.actualYield());
            payload.put("scrapCount", request.scrapCount());
            var ingrList = new java.util.ArrayList<Map<String,Object>>();
            for (var act : request.ingredients()) {
                ingrList.add(Map.of("materialId", act.materialId(), "quantity", act.actualQuantity()));
            }
            payload.put("ingredients", ingrList);
            
            jdbc.update("INSERT INTO production_outbox(tenant_id, aggregate_type, aggregate_id, event_type, payload) VALUES (?, ?, ?, ?, ?::jsonb)",
                tenant(), "Batch", id, "BatchCompleted", mapper.writeValueAsString(payload));
        } catch(Exception e) {
            throw new RuntimeException("Failed to serialize outbox payload", e);
        }
    }
    private void checkVersion(Map<String,Object> row,int version) {
        if (((Number)row.get("version")).intValue()!=version) conflict("Work order changed. Reload before trying again.");
    }
    private void audit(UUID id,String action) {
        jdbc.update("INSERT INTO production_batch_history(id,tenant_id,batch_id,action,actor_id) VALUES (?::uuid,?::uuid,?::uuid,?,?::uuid)",
                UUID.randomUUID(),tenant(),id,action,TenantContext.getCurrentUserId());
    }
    private void conflict(String message) { throw new ResponseStatusException(HttpStatus.CONFLICT,message); }
}
