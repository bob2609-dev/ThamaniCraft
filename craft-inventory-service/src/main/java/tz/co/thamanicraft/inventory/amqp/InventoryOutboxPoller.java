package tz.co.thamanicraft.inventory.amqp;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class InventoryOutboxPoller {
    private final JdbcTemplate jdbc;
    private final RabbitTemplate rabbit;
    private static final Logger log = LoggerFactory.getLogger(InventoryOutboxPoller.class);
    
    public InventoryOutboxPoller(JdbcTemplate jdbc, RabbitTemplate rabbit) { 
        this.jdbc = jdbc; 
        this.rabbit = rabbit; 
    }
    
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void poll() {
        var rows = jdbc.queryForList("SELECT id, event_type, payload FROM inventory_outbox WHERE status='PENDING' ORDER BY created_at LIMIT 50 FOR UPDATE SKIP LOCKED");
        for (var row : rows) {
            UUID id = (UUID) row.get("id");
            String type = (String) row.get("event_type");
            String payload = row.get("payload").toString();
            try {
                rabbit.convertAndSend("inventory.events", type, payload, message -> {
                    message.getMessageProperties().setMessageId(id.toString());
                    message.getMessageProperties().setContentType("application/json");
                    return message;
                });
                jdbc.update("UPDATE inventory_outbox SET status='PROCESSED', processed_at=CURRENT_TIMESTAMP WHERE id=?", id);
                log.info("Processed inventory outbox event {} of type {}", id, type);
            } catch (Exception e) {
                log.error("Failed to send inventory outbox event {}", id, e);
            }
        }
    }
}
