package tz.co.thamanicraft.sales;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.Map;

@Component
public class ProductionWorkOrderClient {
    public record GenerateRequest(UUID recipeId, BigDecimal plannedYield, UUID orderId, UUID orderItemId, String generationKey, String reference) {}
    
    private final RestClient client;
    
    public ProductionWorkOrderClient(@Value("${production.url:http://thamanicraft-production-service:8081}") String url) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000); factory.setReadTimeout(5000);
        client = RestClient.builder().baseUrl(url).requestFactory(factory).build();
    }
    
    public UUID generate(GenerateRequest request, String authorization) {
        try {
            var response = client.post().uri("/work-orders/generate")
                .header("Authorization", authorization)
                .body(request)
                .retrieve().body(Map.class);
            return UUID.fromString((String) response.get("id"));
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 403) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Production execution permission required");
            if (e.getStatusCode().value() == 409) throw new ResponseStatusException(HttpStatus.CONFLICT, "Could not generate work order due to a conflict in Production");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not generate work order. Retry later.");
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Production service unavailable.");
        }
    }
}
