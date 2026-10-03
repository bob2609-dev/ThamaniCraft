package tz.co.thamanicraft.inventory;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class InventoryPostingService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    
    public InventoryPostingService(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }
    
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void processBatchCompleted(UUID eventId, UUID tenantId, String payloadStr) {
        var existing = jdbc.queryForList("SELECT id FROM inventory_inbox WHERE id=?", eventId);
        if (!existing.isEmpty()) return; // Idempotency check
        
        jdbc.update("INSERT INTO inventory_inbox(id, tenant_id, event_type) VALUES (?, ?, ?)", eventId, tenantId, "BatchCompleted");
        
        try {
            var payload = mapper.readValue(payloadStr, Map.class);
            UUID batchId = UUID.fromString(payload.get("batchId").toString());
            
            // Handle ingredients deduction
            List<Map<String, Object>> ingredients = (List<Map<String, Object>>) payload.get("ingredients");
            if (ingredients != null) {
                for (var ingr : ingredients) {
                    UUID materialId = UUID.fromString(ingr.get("materialId").toString());
                    BigDecimal quantity = new BigDecimal(ingr.get("quantity").toString());
                    
                    int updated = jdbc.update(
                        "UPDATE raw_materials SET current_stock_base_qty = current_stock_base_qty - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?", 
                        quantity, materialId, tenantId);
                        
                    if (updated == 0) {
                        throw new RuntimeException("Material not found for: " + materialId);
                    }
                    
                    var materialRows = jdbc.queryForList("SELECT cost_per_base_unit FROM raw_materials WHERE id = ? AND tenant_id = ?", materialId, tenantId);
                    if (!materialRows.isEmpty()) {
                        BigDecimal unitCost = (BigDecimal) materialRows.get(0).get("cost_per_base_unit");
                        BigDecimal totalImpact = quantity.multiply(unitCost).negate();
                        jdbc.update(
                            "INSERT INTO inventory_adjustments(tenant_id, raw_material_id, adjustment_type, quantity_base_qty, total_cost_impact, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
                            tenantId, materialId, "PRODUCTION_CONSUMPTION", quantity.negate(), totalImpact, "Batch " + batchId, "SYSTEM");
                    }
                }
            }
            
            // Handle finished goods credit
            if (payload.get("finishedProductId") != null) {
                UUID finishedProductId = UUID.fromString(payload.get("finishedProductId").toString());
                BigDecimal actualYield = new BigDecimal(payload.get("actualYield").toString());
                
                int updated = jdbc.update(
                    "UPDATE finished_products SET current_stock_base_qty = current_stock_base_qty + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?",
                    actualYield, finishedProductId, tenantId);
                    
                if (updated > 0) {
                    // Need cost for finished product (assume standard cost or 0 for now)
                    var fpRows = jdbc.queryForList("SELECT cost_per_base_unit FROM finished_products WHERE id = ? AND tenant_id = ?", finishedProductId, tenantId);
                    BigDecimal unitCost = fpRows.isEmpty() ? BigDecimal.ZERO : (BigDecimal) fpRows.get(0).get("cost_per_base_unit");
                    BigDecimal totalImpact = actualYield.multiply(unitCost);
                    
                    jdbc.update(
                        "INSERT INTO inventory_adjustments(tenant_id, finished_product_id, adjustment_type, quantity_base_qty, total_cost_impact, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        tenantId, finishedProductId, "PRODUCTION_OUTPUT", actualYield, totalImpact, "Batch " + batchId, "SYSTEM");
                }
            }
            
            // Emit success event back to production
            var responsePayload = new java.util.HashMap<String, Object>();
            responsePayload.put("tenantId", tenantId);
            responsePayload.put("batchId", batchId);
            responsePayload.put("success", true);
            
            jdbc.update("INSERT INTO inventory_outbox(tenant_id, aggregate_type, aggregate_id, event_type, payload) VALUES (?, ?, ?, ?, ?::jsonb)",
                tenantId, "Batch", batchId, "StockPosted", mapper.writeValueAsString(responsePayload));
                
        } catch (Exception e) {
            try {
                var payload = mapper.readValue(payloadStr, Map.class);
                UUID batchId = UUID.fromString(payload.get("batchId").toString());
                var responsePayload = new java.util.HashMap<String, Object>();
                responsePayload.put("tenantId", tenantId);
                responsePayload.put("batchId", batchId);
                responsePayload.put("success", false);
                responsePayload.put("error", e.getMessage());
                
                jdbc.update("INSERT INTO inventory_outbox(tenant_id, aggregate_type, aggregate_id, event_type, payload) VALUES (?, ?, ?, ?, ?::jsonb)",
                    tenantId, "Batch", batchId, "StockPostFailed", mapper.writeValueAsString(responsePayload));
            } catch (Exception ex) {
                throw new RuntimeException("Failed to serialize or save error response", ex);
            }
        }
    }
}
