package com.thamanicraft.identity.controller;

import com.thamanicraft.identity.dto.SubscriptionPlanDto;
import com.thamanicraft.identity.dto.SubscriptionInvoiceDto;
import com.thamanicraft.identity.dto.TenantSubscriptionDto;
import com.thamanicraft.identity.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlanDto>> getAllPlans() {
        return ResponseEntity.ok(subscriptionService.getAllPlans());
    }

    @GetMapping("/plans/{code}")
    public ResponseEntity<SubscriptionPlanDto> getPlanByCode(@PathVariable String code) {
        return ResponseEntity.ok(subscriptionService.getPlanByCode(code));
    }

    @PostMapping("/plans")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SubscriptionPlanDto> createPlan(@RequestBody SubscriptionPlanDto planDto) {
        return ResponseEntity.ok(subscriptionService.createPlan(planDto));
    }

    @PutMapping("/plans/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SubscriptionPlanDto> updatePlan(@PathVariable UUID id, @RequestBody SubscriptionPlanDto planDto) {
        return ResponseEntity.ok(subscriptionService.updatePlan(id, planDto));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<TenantSubscriptionDto> getTenantSubscription(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(subscriptionService.getTenantSubscription(tenantId));
    }

    @PostMapping("/tenant/{tenantId}/assign/{planCode}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('TENANT_ADMIN') or hasRole('OWNER')")
    public ResponseEntity<TenantSubscriptionDto> assignPlanToTenant(
            @PathVariable UUID tenantId, 
            @PathVariable String planCode) {
        return ResponseEntity.ok(subscriptionService.assignPlanToTenant(tenantId, planCode));
    }

    @GetMapping("/tenant/{tenantId}/invoices")
    public ResponseEntity<List<SubscriptionInvoiceDto>> getTenantInvoices(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(subscriptionService.getTenantInvoices(tenantId));
    }

    @GetMapping("/invoices/pending")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<SubscriptionInvoiceDto>> getPendingInvoices() {
        return ResponseEntity.ok(subscriptionService.getPendingInvoices());
    }

    @PostMapping("/invoices/{invoiceId}/submit-proof")
    public ResponseEntity<SubscriptionInvoiceDto> submitProof(
            @PathVariable UUID invoiceId,
            @RequestBody Map<String, String> payload) {
        String reference = payload.get("reference");
        String fileUrl = payload.get("proofBase64"); // Base64 string
        return ResponseEntity.ok(subscriptionService.submitProofOfPayment(invoiceId, reference, fileUrl));
    }

    @PostMapping("/invoices/{invoiceId}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SubscriptionInvoiceDto> approvePayment(@PathVariable UUID invoiceId) {
        return ResponseEntity.ok(subscriptionService.approvePayment(invoiceId));
    }

    @PostMapping("/invoices/{invoiceId}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SubscriptionInvoiceDto> rejectPayment(
            @PathVariable UUID invoiceId,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(subscriptionService.rejectPayment(invoiceId, payload.get("reason")));
    }
}
