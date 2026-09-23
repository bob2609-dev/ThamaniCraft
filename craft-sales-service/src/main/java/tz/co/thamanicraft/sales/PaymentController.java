package tz.co.thamanicraft.sales;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ProblemDetail;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/orders/{order}/payments")
public class PaymentController {
    private final PaymentService service;
    public PaymentController(PaymentService service) { this.service=service; }
    @PostMapping @PreAuthorize("hasRole('OWNER') or hasAuthority('RECORD_PAYMENTS')")
    public Map<String,UUID> record(@PathVariable UUID order,@Valid @RequestBody PaymentService.Receipt receipt) {
        return Map.of("id",service.record(order,receipt));
    }
    @PostMapping("/{payment}/reverse") @PreAuthorize("hasRole('OWNER') or hasAuthority('REVERSE_PAYMENTS')")
    public Map<String,UUID> reverse(@PathVariable UUID order,@PathVariable UUID payment,@Valid @RequestBody PaymentService.Reversal request) {
        service.reverse(order,payment,request);return Map.of("id",payment);
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail status(ResponseStatusException e) { return ProblemDetail.forStatusAndDetail(e.getStatusCode(),e.getReason()); }
}
