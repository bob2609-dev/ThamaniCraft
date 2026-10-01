package tz.co.thamanicraft.production;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/work-orders")
@RequiredArgsConstructor
public class WorkOrderController {
    private final WorkOrderService service;

    @GetMapping
    @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_PRODUCTION')")
    public List<Map<String, Object>> list() {
        return service.list();
    }

    @GetMapping("/recipes")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_PRODUCTION')")
    public List<Map<String, Object>> recipes() {
        return service.recipes();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_PRODUCTION')")
    public Map<String, Object> detail(@PathVariable UUID id) {
        return service.detail(id);
    }
    
    @PostMapping("/{id}/complete") 
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('OWNER') or hasAuthority('EXECUTE_PRODUCTION')")
    public void complete(@PathVariable UUID id, @Valid @RequestBody WorkOrderRequest.Completion request) {
        service.complete(id, request);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('OWNER') or hasAuthority('EXECUTE_PRODUCTION')")
    public Map<String, UUID> create(@Valid @RequestBody WorkOrderRequest request) {
        return Map.of("id", service.save(null, request));
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("permitAll()")
    public Map<String, UUID> generate(@Valid @RequestBody WorkOrderService.GenerateRequest request) {
        return Map.of("id", service.generate(request));
    }

    @PostMapping("/quick-make")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('OWNER') or hasAuthority('EXECUTE_PRODUCTION')")
    public Map<String, UUID> quickMake(@Valid @RequestBody WorkOrderRequest request) {
        return Map.of("id", service.quickMake(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or hasAuthority('EXECUTE_PRODUCTION')")
    public Map<String, UUID> edit(@PathVariable UUID id, @Valid @RequestBody WorkOrderRequest request) {
        return Map.of("id", service.save(id, request));
    }

    @PostMapping("/{id}/{action:schedule|start|cancel}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('OWNER') or hasAuthority('EXECUTE_PRODUCTION')")
    public void transition(@PathVariable UUID id, @PathVariable String action,
            @Valid @RequestBody WorkOrderRequest.Transition request) {
        service.transition(id, action, request.version());
    }
}
