package tz.co.thamanicraft.finance;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import java.util.*;

@RestController
public class FinanceController {
    private final FinanceService service;
    public FinanceController(FinanceService service) { this.service = service; }
    @GetMapping("/assets") @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_FINANCE')")
    public List<Map<String,Object>> assets() { return service.assets(); }
    @GetMapping("/leases") @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_FINANCE')")
    public List<Map<String,Object>> leases() { return service.leases(); }
    @PostMapping("/assets") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('OWNER') or hasAuthority('MANAGE_FINANCE')")
    public Map<String,UUID> createAsset(@Valid @RequestBody FinanceRequests.Asset request) { return Map.of("id",service.saveAsset(null,request)); }
    @PutMapping("/assets/{id}") @PreAuthorize("hasRole('OWNER') or hasAuthority('MANAGE_FINANCE')")
    public Map<String,UUID> updateAsset(@PathVariable UUID id,@Valid @RequestBody FinanceRequests.Asset request) { return Map.of("id",service.saveAsset(id,request)); }
    @GetMapping("/expenses") @PreAuthorize("hasRole('OWNER') or hasAuthority('VIEW_FINANCE')")
    public List<Map<String,Object>> expenses() { return service.expenses(); }
    @PostMapping("/expenses") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('OWNER') or hasAuthority('MANAGE_FINANCE')")
    public Map<String,UUID> createExpense(@Valid @RequestBody FinanceRequests.Expense request) { return Map.of("id",service.saveExpense(null,request)); }
    @PutMapping("/expenses/{id}") @PreAuthorize("hasRole('OWNER') or hasAuthority('MANAGE_FINANCE')")
    public Map<String,UUID> updateExpense(@PathVariable UUID id,@Valid @RequestBody FinanceRequests.Expense request) { return Map.of("id",service.saveExpense(id,request)); }
    @PostMapping("/quick-expense") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('OWNER') or hasAuthority('MANAGE_FINANCE')")
    public Map<String,UUID> createQuickExpense(@Valid @RequestBody FinanceRequests.Expense request) { return Map.of("id",service.quickExpense(request)); }
    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail status(ResponseStatusException error) { return ProblemDetail.forStatusAndDetail(error.getStatusCode(),error.getReason()); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail validation(MethodArgumentNotValidException error) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,error.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField()+": "+f.getDefaultMessage()).findFirst().orElse("Check the form fields"));
    }
}
