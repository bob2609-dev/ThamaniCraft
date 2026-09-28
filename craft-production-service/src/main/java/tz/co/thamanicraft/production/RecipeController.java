package tz.co.thamanicraft.production;

import com.thamanicraft.security.context.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/recipes")
@RequiredArgsConstructor
public class RecipeController {
    private final RecipeService service;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_RECIPES') or hasRole('OWNER')")
    public List<Map<String, Object>> list() {
        return service.list(TenantContext.getCurrentTenant());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('VIEW_RECIPES') or hasRole('OWNER')")
    public Map<String, Object> detail(@PathVariable UUID id) {
        return service.detail(TenantContext.getCurrentTenant(), id);
    }

    @PostMapping("/preview")
    @PreAuthorize("hasAuthority('VIEW_RECIPES') or hasRole('OWNER')")
    public Map<String, Object> preview(@Valid @RequestBody RecipeRequest request) {
        return service.preview(TenantContext.getCurrentTenant(), request);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('CREATE_RECIPES') or hasRole('OWNER')")
    public Map<String, UUID> create(@Valid @RequestBody RecipeRequest request) {
        return Map.of("id", service.save(TenantContext.getCurrentTenant(), null, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CREATE_RECIPES') or hasRole('OWNER')")
    public Map<String, UUID> update(@PathVariable UUID id, @Valid @RequestBody RecipeRequest request) {
        return Map.of("id", service.save(TenantContext.getCurrentTenant(), id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('CREATE_RECIPES') or hasRole('OWNER')")
    public void archive(@PathVariable UUID id) {
        service.archive(TenantContext.getCurrentTenant(), id);
    }
}
