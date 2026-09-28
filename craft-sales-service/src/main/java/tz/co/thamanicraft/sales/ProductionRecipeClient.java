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
public class ProductionRecipeClient {
    public record Costing(BigDecimal batchCost) {}
    public record Recipe(UUID id,String name,UUID yieldUomId,String yieldUnit,BigDecimal yieldQuantity,Costing costing) {}
    private final RestClient client;
    public ProductionRecipeClient(@Value("${production.url:http://thamanicraft-production-service:8081}") String url) {
        var factory=new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);factory.setReadTimeout(5000);
        client=RestClient.builder().baseUrl(url).requestFactory(factory).build();
    }
    public Recipe get(UUID id,String authorization) {
        try {
            Recipe recipe=client.get().uri("/recipes/{id}",id).header("Authorization",authorization).retrieve().body(Recipe.class);
            if(recipe==null || recipe.yieldUnit()==null || recipe.costing()==null)
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Recipe output information is unavailable");
            return recipe;
        } catch(RestClientResponseException e) {
            if(e.getStatusCode().value()==403) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Recipe viewing permission required");
            if(e.getStatusCode().value()==404) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Active recipe not found");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Could not validate recipe. Retry later.");
        } catch(RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Production service unavailable. No mapping saved.");
        }
    }
}
