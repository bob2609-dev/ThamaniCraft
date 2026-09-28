package tz.co.thamanicraft.production.amqp;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class ProductionAmqpConfig {
    @Bean
    public TopicExchange productionExchange() {
        return new TopicExchange("production.events");
    }
}
