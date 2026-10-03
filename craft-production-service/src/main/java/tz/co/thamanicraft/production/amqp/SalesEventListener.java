package tz.co.thamanicraft.production.amqp;

import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tz.co.thamanicraft.production.WorkOrderService;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;
import java.math.BigDecimal;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SalesEventListener {
    private final WorkOrderService workOrderService;
    private final ObjectMapper mapper;
    private static final Logger log = LoggerFactory.getLogger(SalesEventListener.class);

    public SalesEventListener(WorkOrderService workOrderService, ObjectMapper mapper) {
        this.workOrderService = workOrderService;
        this.mapper = mapper;
    }

    @RabbitListener(bindings = @QueueBinding(
        value = @Queue(value = "production.sales.events", durable = "true"),
        exchange = @Exchange(value = "sales.events", type = "topic"),
        key = "OrderFulfillment"
    ))
    public void onOrderFulfillment(Map<String, Object> data) {
        try {
            if (!"JUST_IN_TIME".equals(data.get("type"))) {
                return; // We only process JIT fulfillments to create silent work orders
            }

            Object tenantObj = data.get("tenantId");
            if (tenantObj == null) {
                log.error("Received OrderFulfillment event without tenantId, ignoring. Payload: {}", data);
                return;
            }
            
            UUID tenantId = UUID.fromString(tenantObj.toString());
            UUID orderId = UUID.fromString(data.get("orderId").toString());
            
            Object orderItemObj = data.get("orderItemId");
            UUID orderItemId = null;
            if (orderItemObj != null && !orderItemObj.toString().isBlank()) {
                orderItemId = UUID.fromString(orderItemObj.toString());
            }
            
            UUID recipeId = UUID.fromString(data.get("recipeId").toString());
            BigDecimal quantity = new BigDecimal(data.get("quantity").toString());

            workOrderService.executeJustInTime(tenantId, orderId, orderItemId, recipeId, quantity);
            
            log.info("Successfully executed JIT production for order {}", orderId);
        } catch (Exception e) {
            log.error("Failed to process OrderFulfillment event", e);
            throw new RuntimeException("Requeue event", e);
        }
    }
}
