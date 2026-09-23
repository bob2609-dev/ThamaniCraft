package tz.co.thamanicraft.inventory.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tz.co.thamanicraft.inventory.dto.CostCorrectionRequest;
import tz.co.thamanicraft.inventory.entity.RawMaterial;
import tz.co.thamanicraft.inventory.service.CostCorrectionService;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/raw-materials")
@RequiredArgsConstructor
public class CostCorrectionController {
    private final CostCorrectionService service;

    @PatchMapping("/{id}/cost")
    @PreAuthorize("hasAuthority('ADJUST_INVENTORY') or hasRole('OWNER')")
    public RawMaterial correct(@PathVariable UUID id, @Valid @RequestBody CostCorrectionRequest request) {
        return service.correct(id, request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> error(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", error.getReason()));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validationError() {
        return ResponseEntity.badRequest().body(Map.of("message",
                "Enter a non-negative cost with at most 4 decimal places, a base unit, and a reason (maximum 500 characters)."));
    }
}
