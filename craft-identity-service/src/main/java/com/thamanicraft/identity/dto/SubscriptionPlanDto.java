package com.thamanicraft.identity.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class SubscriptionPlanDto {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private BigDecimal monthlyPrice;
    private Integer maxUsers;
    private String includedModules;
    private boolean isActive;
}
