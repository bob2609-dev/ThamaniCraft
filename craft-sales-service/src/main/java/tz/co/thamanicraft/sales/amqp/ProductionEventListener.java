package tz.co.thamanicraft.sales.amqp;

import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class ProductionEventListener {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private static final Logger log = LoggerFactory.getLogger(ProductionEventListener.class);
    
    public ProductionEventListener(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }
    
    @RabbitListener(bindings = @QueueBinding(
        value = @Queue(value = "sales.production.events", durable = "true"),
        exchange = @Exchange(value = "production.events", type = "topic"),
        key = "BatchCompleted"
    ))
    public void onBatchCompleted(String payload, 
                               @Header(AmqpHeaders.MESSAGE_ID) String messageId) {
        try {
            var data = mapper.readValue(payload, Map.class);
            Object tenantObj = data.get("tenantId");
            if (tenantObj == null) {
                log.error("Received BatchCompleted event without tenantId, ignoring. Event: {}", messageId);
                return;
            }
            UUID tenantId = UUID.fromString(tenantObj.toString());
            String batchIdStr = (String) data.get("batchId");
            if (batchIdStr == null) {
                 log.error("BatchCompleted event missing batchId");
                 return;
            }
            UUID batchId = UUID.fromString(batchIdStr);
            
            // Sync status to sales.order_items
            int updated = jdbc.update(
                "UPDATE sales.order_items SET work_order_status = 'COMPLETED' WHERE work_order_id = ?",
                batchId
            );
            
            log.info("Successfully processed BatchCompleted event: {}. Updated {} items.", messageId, updated);
        } catch (Exception e) {
            log.error("Failed to parse or process BatchCompleted event: {}", messageId, e);
            throw new RuntimeException("Requeue event", e); // Throw exception to nack/requeue if needed
        }
    }
}
