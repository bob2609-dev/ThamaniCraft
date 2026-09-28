package tz.co.thamanicraft.production;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class WorkOrderCompletionService {
    private final JdbcTemplate jdbc;
    private static final Logger log = LoggerFactory.getLogger(WorkOrderCompletionService.class);
    
    public WorkOrderCompletionService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }
    
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void processStockPosted(UUID eventId, UUID tenantId, UUID batchId) {
        var existing = jdbc.queryForList("SELECT id FROM production_inbox WHERE id=?", eventId);
        if (!existing.isEmpty()) return; // Idempotency check
        
        jdbc.update("INSERT INTO production_inbox(id, tenant_id, event_type) VALUES (?::uuid, ?::uuid, ?)", eventId, tenantId, "StockPosted");
        
        int updated = jdbc.update("UPDATE production_batches SET status='COMPLETED', version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? AND status='COMPLETION_PENDING'", batchId, tenantId);
        if (updated > 0) {
            jdbc.update("INSERT INTO production_batch_history(id,tenant_id,batch_id,action,actor_id) VALUES (?::uuid,?::uuid,?::uuid,?,?::uuid)",
                UUID.randomUUID(), tenantId, batchId, "COMPLETED", UUID.fromString("00000000-0000-0000-0000-000000000000"));
        } else {
            log.warn("Batch {} not in COMPLETION_PENDING state or does not exist", batchId);
        }
    }
    
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void processStockPostFailed(UUID eventId, UUID tenantId, UUID batchId, String error) {
        var existing = jdbc.queryForList("SELECT id FROM production_inbox WHERE id=?", eventId);
        if (!existing.isEmpty()) return;
        
        jdbc.update("INSERT INTO production_inbox(id, tenant_id, event_type) VALUES (?::uuid, ?::uuid, ?)", eventId, tenantId, "StockPostFailed");
        
        int updated = jdbc.update("UPDATE production_batches SET status='COMPLETION_FAILED', version=version+1, updated_at=CURRENT_TIMESTAMP, notes=CONCAT(COALESCE(notes, ''), '\nStock posting failed: ', ?) WHERE id=? AND tenant_id=? AND status='COMPLETION_PENDING'", 
            error, batchId, tenantId);
        if (updated > 0) {
            jdbc.update("INSERT INTO production_batch_history(id,tenant_id,batch_id,action,actor_id) VALUES (?::uuid,?::uuid,?::uuid,?,?::uuid)",
                UUID.randomUUID(), tenantId, batchId, "COMPLETION_FAILED", UUID.fromString("00000000-0000-0000-0000-000000000000"));
        }
    }
}
