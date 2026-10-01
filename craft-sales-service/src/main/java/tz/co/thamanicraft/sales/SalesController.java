package tz.co.thamanicraft.sales;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import java.util.*;

@RestController
public class SalesController {
    private final SalesService service;

    public SalesController(SalesService service) {
        this.service = service;
    }

    @GetMapping("/customers")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_SALES')")
    public List<Map<String, Object>> customers() {
        return service.customers();
    }

    @PostMapping("/customers")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('OWNER') or hasAuthority('PROCESS_SALES')")
    public Map<String, UUID> createCustomer(@Valid @RequestBody SalesRequests.Customer c) {
        return Map.of("id", service.saveCustomer(null, c));
    }

    @PutMapping("/customers/{id}")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('PROCESS_SALES')")
    public Map<String, UUID> editCustomer(@PathVariable UUID id, @Valid @RequestBody SalesRequests.Customer c) {
        return Map.of("id", service.saveCustomer(id, c));
    }

    @GetMapping("/orders")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_SALES')")
    public List<Map<String, Object>> orders() {
        return service.orders();
    }

    @GetMapping("/orders/{id}")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_SALES')")
    public Map<String, Object> order(@PathVariable UUID id) {
        return service.order(id);
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('OWNER') or hasAuthority('PROCESS_SALES')")
    public Map<String, UUID> create(@Valid @RequestBody SalesRequests.Order o,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return Map.of("id", service.createOrder(o, auth));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail status(ResponseStatusException e) {
        return ProblemDetail.forStatusAndDetail(e.getStatusCode(), e.getReason());
    }

    @PutMapping("/orders/{id}")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('PROCESS_SALES')")
    public Map<String, UUID> edit(@PathVariable UUID id, @Valid @RequestBody SalesRequests.Edit request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        service.editOrder(id, request, auth);
        return Map.of("id", id);
    }

    @PostMapping("/orders/{id}/{action}")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('PROCESS_SALES')")
    public Map<String, UUID> transition(@PathVariable UUID id, @PathVariable String action,
            @Valid @RequestBody SalesRequests.Transition request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        service.transition(id, action, request, auth);
        return Map.of("id", id);
    }

    @PostMapping("/orders/{id}/fulfill")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('PROCESS_SALES')")
    public Map<String, UUID> fulfill(@PathVariable UUID id, @Valid @RequestBody SalesRequests.Fulfill request,
            @RequestHeader("Authorization") String auth) {
        service.fulfillOrder(id, request, auth);
        return Map.of("id", id);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail validation(MethodArgumentNotValidException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                e.getBindingResult().getFieldErrors().stream().map(f -> f.getField() + ": " + f.getDefaultMessage())
                        .findFirst().orElse("Check form fields"));
    }

    @PostMapping("/orders/{id}/settle-cancellation")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('PROCESS_SALES')")
    public Map<String, UUID> settleCancellation(@PathVariable UUID id,
            @Valid @RequestBody SalesRequests.SettleCancellation request, @RequestHeader("Authorization") String auth) {
        service.settleCancellation(id, request, auth);
        return Map.of("id", id);
    }
    @PostMapping("/pos/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('OWNER') or hasAuthority('PROCESS_SALES')")
    public Map<String, UUID> posCheckout(@Valid @RequestBody SalesRequests.POSCheckout request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return Map.of("id", service.posCheckout(request, auth));
    }
}
