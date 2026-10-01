package tz.co.thamanicraft.inventory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
public class FinanceClient {

    private final RestClient client;

    public FinanceClient(@Value("${finance.url:http://thamanicraft-finance-service:8084}") String url) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000); 
        factory.setReadTimeout(5000);
        client = RestClient.builder().baseUrl(url).requestFactory(factory).build();
    }

    public void postJournalEntry(String reference, String description, List<Map<String, Object>> lines, String token) {
        try {
            client.post()
                  .uri("/ledger/journal")
                  .header("Authorization", token)
                  .body(Map.of(
                      "reference", reference,
                      "description", description,
                      "lines", lines
                  ))
                  .retrieve()
                  .toBodilessEntity();
        } catch (Exception e) {
            System.err.println("Failed to post journal entry: " + e.getMessage());
            // Log it but don't fail the sale
        }
    }
}
