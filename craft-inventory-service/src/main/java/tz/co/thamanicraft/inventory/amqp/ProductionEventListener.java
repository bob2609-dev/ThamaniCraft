package tz.co.thamanicraft.inventory.amqp;

import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import tz.co.thamanicraft.inventory.InventoryPostingService;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.thamanicraft.security.context.TenantContext;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class ProductionEventListener {
    private final InventoryPostingService postingService;
    private final ObjectMapper mapper;
    private static final Logger log = LoggerFactory.getLogger(ProductionEventListener.class);
    
    public ProductionEventListener(InventoryPostingService postingService, ObjectMapper mapper) {
        this.postingService = postingService;
        this.mapper = mapper;
    }
    
    @RabbitListener(bindings = @QueueBinding(
        value = @Queue(value = "inventory.production.events", durable = "true"),
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
            postingService.processBatchCompleted(UUID.fromString(messageId), tenantId, payload);
            log.info("Successfully processed BatchCompleted event: {}", messageId);
        } catch (Exception e) {
            log.error("Failed to parse or process BatchCompleted event: {}", messageId, e);
            throw new RuntimeException("Requeue event", e); // Throw exception to nack/requeue if needed
        }
    }
}
