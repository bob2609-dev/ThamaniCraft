package com.thamanicraft.identity.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class TenantSubscriptionDto {
    private UUID id;
    private UUID tenantId;
    private SubscriptionPlanDto plan;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate nextBillingDate;
    private boolean isAutoRenew;
}
