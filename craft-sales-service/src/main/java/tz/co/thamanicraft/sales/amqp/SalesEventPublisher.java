package tz.co.thamanicraft.sales.amqp;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.UUID;
import com.thamanicraft.security.context.TenantContext;

@Component
public class SalesEventPublisher {
    private final RabbitTemplate rabbit;

    public SalesEventPublisher(RabbitTemplate rabbit) {
        this.rabbit = rabbit;
    }

    public void publishFulfillment(UUID orderId, UUID productId, String type, java.math.BigDecimal quantity, UUID recipeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Map<String, Object> payload = Map.of(
            "tenantId", tenantId.toString(),
            "orderId", orderId.toString(),
            "productId", productId.toString(),
            "type", type,
            "quantity", quantity,
            "recipeId", recipeId != null ? recipeId.toString() : ""
        );
        rabbit.convertAndSend("sales.events", "OrderFulfillment", payload);
    }
}
