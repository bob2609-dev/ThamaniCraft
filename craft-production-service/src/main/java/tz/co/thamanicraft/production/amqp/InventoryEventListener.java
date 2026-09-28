package tz.co.thamanicraft.production.amqp;

import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import tz.co.thamanicraft.production.WorkOrderCompletionService;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class InventoryEventListener {
    private final WorkOrderCompletionService completionService;
    private final ObjectMapper mapper;
    private static final Logger log = LoggerFactory.getLogger(InventoryEventListener.class);

    public InventoryEventListener(WorkOrderCompletionService completionService, ObjectMapper mapper) {
        this.completionService = completionService;
        this.mapper = mapper;
    }

    @RabbitListener(bindings = @QueueBinding(value = @Queue(value = "production.inventory.events", durable = "true"), exchange = @Exchange(value = "inventory.events", type = "topic"), key = "StockPosted"))
    public void onStockPosted(String payload, @Header(AmqpHeaders.MESSAGE_ID) String messageId) {
        try {
            var data = mapper.readValue(payload, Map.class);
            UUID tenantId = UUID.fromString(data.get("tenantId").toString());
            UUID batchId = UUID.fromString(data.get("batchId").toString());
            completionService.processStockPosted(UUID.fromString(messageId), tenantId, batchId);
            log.info("Successfully processed StockPosted event for batch {}", batchId);
        } catch (Exception e) {
            log.error("Failed to parse StockPosted event: {}", messageId, e);
            throw new RuntimeException("Requeue", e);
        }
    }

    @RabbitListener(bindings = @QueueBinding(value = @Queue(value = "production.inventory.failed.events", durable = "true"), exchange = @Exchange(value = "inventory.events", type = "topic"), key = "StockPostFailed"))
    public void onStockPostFailed(String payload, @Header(AmqpHeaders.MESSAGE_ID) String messageId) {
        try {
            var data = mapper.readValue(payload, Map.class);
            UUID tenantId = UUID.fromString(data.get("tenantId").toString());
            UUID batchId = UUID.fromString(data.get("batchId").toString());
            String error = data.get("error") != null ? data.get("error").toString() : "Unknown error";
            completionService.processStockPostFailed(UUID.fromString(messageId), tenantId, batchId, error);
            log.info("Successfully processed StockPostFailed event for batch {}", batchId);
        } catch (Exception e) {
            log.error("Failed to parse StockPostFailed event: {}", messageId, e);
            throw new RuntimeException("Requeue", e);
        }
    }
}
