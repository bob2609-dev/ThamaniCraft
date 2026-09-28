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

@Component
public class InventoryDispatchClient {
    public record DispatchPayload(BigDecimal quantity, String reference, String notes) {}

    private final RestClient client;

    public InventoryDispatchClient(@Value("${inventory.url:http://thamanicraft-inventory-service:8080}") String url) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        client = RestClient.builder().baseUrl(url).requestFactory(factory).build();
    }

    public void dispatch(UUID finishedProductId, BigDecimal quantity, String reference, String notes, String authorization) {
        try {
            client.post()
                .uri("/finished-products/{id}/dispatch", finishedProductId)
                .header("Authorization", authorization)
                .body(new DispatchPayload(quantity, reference, notes))
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 409) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Stock dispatch failed: " + e.getResponseBodyAsString());
            }
            if (e.getStatusCode().value() == 403) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Inventory dispatch permission required");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not dispatch stock from inventory.");
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Inventory service unavailable. Fulfillment aborted.");
        }
    }
}
