package tz.co.thamanicraft.production.amqp;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class OutboxPoller {
    private final JdbcTemplate jdbc;
    private final RabbitTemplate rabbit;
    private static final Logger log = LoggerFactory.getLogger(OutboxPoller.class);
    
    public OutboxPoller(JdbcTemplate jdbc, RabbitTemplate rabbit) { this.jdbc = jdbc; this.rabbit = rabbit; }
    
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void poll() {
        var rows = jdbc.queryForList("SELECT id, event_type, payload FROM production_outbox WHERE status='PENDING' ORDER BY created_at LIMIT 50 FOR UPDATE SKIP LOCKED");
        for (var row : rows) {
            UUID id = (UUID) row.get("id");
            String type = (String) row.get("event_type");
            String payload = row.get("payload").toString();
            try {
                rabbit.convertAndSend("production.events", type, payload, message -> {
                    message.getMessageProperties().setMessageId(id.toString());
                    message.getMessageProperties().setContentType("application/json");
                    return message;
                });
                jdbc.update("UPDATE production_outbox SET status='PROCESSED', processed_at=CURRENT_TIMESTAMP WHERE id=?", id);
                log.info("Processed production outbox event {} of type {}", id, type);
            } catch (Exception e) {
                log.error("Failed to send production outbox event {}", id, e);
            }
        }
    }
}
