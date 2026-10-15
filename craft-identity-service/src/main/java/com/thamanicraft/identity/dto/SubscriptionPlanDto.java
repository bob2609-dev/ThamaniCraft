package com.thamanicraft.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    @JsonProperty("active")
    private boolean active = true;

    @JsonProperty("visibleToCustomers")
    private boolean visibleToCustomers = true;

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isVisibleToCustomers() {
        return visibleToCustomers;
    }

    public void setVisibleToCustomers(boolean visibleToCustomers) {
        this.visibleToCustomers = visibleToCustomers;
    }
}
