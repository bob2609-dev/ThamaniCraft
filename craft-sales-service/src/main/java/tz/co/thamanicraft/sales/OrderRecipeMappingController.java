package tz.co.thamanicraft.sales;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ProblemDetail;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
public class OrderRecipeMappingController {
    private final OrderRecipeMappingService service;
    private final ProductionRecipeClient production;

    public OrderRecipeMappingController(OrderRecipeMappingService service, ProductionRecipeClient production) {
        this.service = service;
        this.production = production;
    }

    @PutMapping("/orders/{order}/items/{item}/recipe")
    @PreAuthorize("hasRole('OWNER') or (hasAuthority('PROCESS_SALES') and hasAuthority('VIEW_RECIPES'))")
    public Map<String, UUID> save(@PathVariable UUID order, @PathVariable UUID item,
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody OrderRecipeMappingService.Request request) {
        var recipe = production.get(request.recipeId(), authorization);
        service.save(order, item, request, recipe);
        return Map.of("id", item);
    }

    @PostMapping("/orders/{order}/items/{item}/work-order")
    @PreAuthorize("permitAll()")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void generateWorkOrder(@PathVariable UUID order, @PathVariable UUID item,
            @RequestHeader("Authorization") String authorization, @Valid @RequestBody Map<String, Integer> request) {
        service.generateWorkOrder(order, item, request.get("version"), authorization);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail error(ResponseStatusException e) {
        return ProblemDetail.forStatusAndDetail(e.getStatusCode(), e.getReason());
    }
}
