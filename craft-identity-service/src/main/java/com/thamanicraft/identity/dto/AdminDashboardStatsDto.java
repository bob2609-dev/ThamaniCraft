package com.thamanicraft.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDto {
    private long totalTenants;
    private long activeTenants;
    private long suspendedTenants;
    private BigDecimal mrr;
    private long activeSubscriptions;
    private long pendingInvoicesCount;
    private List<PlanDistributionItem> planDistribution;
    private List<RecentTenantItem> recentTenants;
    private Map<String, Object> systemHealth;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanDistributionItem {
        private String code;
        private String name;
        private long count;
        private BigDecimal monthlyPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentTenantItem {
        private String id;
        private String name;
        private String displayName;
        private boolean active;
        private String createdAt;
        private String planCode;
        private String planName;
    }
}
