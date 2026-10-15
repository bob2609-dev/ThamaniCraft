package com.thamanicraft.identity.service;

import com.thamanicraft.identity.dto.SubscriptionPlanDto;
import com.thamanicraft.identity.dto.SubscriptionInvoiceDto;
import com.thamanicraft.identity.dto.TenantSubscriptionDto;

import java.util.List;
import java.util.UUID;

public interface SubscriptionService {
    List<SubscriptionPlanDto> getAllPlans();
    List<SubscriptionPlanDto> getAllPlans(boolean publicOnly);
    SubscriptionPlanDto getPlanByCode(String code);
    SubscriptionPlanDto createPlan(SubscriptionPlanDto planDto);
    SubscriptionPlanDto updatePlan(UUID id, SubscriptionPlanDto planDto);
    
    TenantSubscriptionDto getTenantSubscription(UUID tenantId);
    TenantSubscriptionDto assignPlanToTenant(UUID tenantId, String planCode);
    TenantSubscriptionDto assignPlanToTenant(UUID tenantId, String planCode, boolean autoActivate, boolean isSuperAdmin);
    
    List<SubscriptionInvoiceDto> getTenantInvoices(UUID tenantId);
    List<SubscriptionInvoiceDto> getPendingInvoices();
    SubscriptionInvoiceDto submitProofOfPayment(UUID invoiceId, String reference, String fileUrl);
    SubscriptionInvoiceDto approvePayment(UUID invoiceId);
    SubscriptionInvoiceDto rejectPayment(UUID invoiceId, String reason);
}
