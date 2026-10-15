package com.thamanicraft.identity.service;

import com.thamanicraft.identity.dto.AdminDashboardStatsDto;
import com.thamanicraft.identity.entity.SubscriptionPlan;
import com.thamanicraft.identity.entity.Tenant;
import com.thamanicraft.identity.entity.TenantSubscription;
import com.thamanicraft.identity.repository.SubscriptionInvoiceRepository;
import com.thamanicraft.identity.repository.SubscriptionPlanRepository;
import com.thamanicraft.identity.repository.TenantRepository;
import com.thamanicraft.identity.repository.TenantSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final TenantRepository tenantRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionInvoiceRepository subscriptionInvoiceRepository;

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getDashboardStats() {
        long totalTenants = tenantRepository.count();
        long activeTenants = tenantRepository.countActive();
        long suspendedTenants = tenantRepository.countSuspended();

        List<TenantSubscription> activeSubs = tenantSubscriptionRepository.findAllActiveWithPlanAndTenant();
        long activeSubscriptions = activeSubs.size();

        BigDecimal mrr = activeSubs.stream()
                .map(ts -> ts.getPlan() != null && ts.getPlan().getMonthlyPrice() != null ? ts.getPlan().getMonthlyPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingInvoicesCount = subscriptionInvoiceRepository.countByStatus("PENDING_VERIFICATION");

        Map<String, Long> planCounts = activeSubs.stream()
                .filter(ts -> ts.getPlan() != null)
                .collect(Collectors.groupingBy(ts -> ts.getPlan().getCode(), Collectors.counting()));

        List<SubscriptionPlan> allPlans = subscriptionPlanRepository.findAll();
        List<AdminDashboardStatsDto.PlanDistributionItem> planDistribution = allPlans.stream()
                .map(p -> AdminDashboardStatsDto.PlanDistributionItem.builder()
                        .code(p.getCode())
                        .name(p.getName())
                        .count(planCounts.getOrDefault(p.getCode(), 0L))
                        .monthlyPrice(p.getMonthlyPrice())
                        .build())
                .collect(Collectors.toList());

        Map<UUID, TenantSubscription> tenantActiveSubMap = activeSubs.stream()
                .filter(ts -> ts.getTenant() != null && ts.getTenant().getId() != null)
                .collect(Collectors.toMap(ts -> ts.getTenant().getId(), ts -> ts, (existing, replacement) -> existing));

        List<Tenant> recentTenantsList = tenantRepository.findAllOrderByCreatedAtDesc();
        List<AdminDashboardStatsDto.RecentTenantItem> recentTenants = recentTenantsList.stream()
                .limit(10)
                .map(t -> {
                    TenantSubscription sub = tenantActiveSubMap.get(t.getId());
                    String planCode = sub != null && sub.getPlan() != null ? sub.getPlan().getCode() : "NONE";
                    String planName = sub != null && sub.getPlan() != null ? sub.getPlan().getName() : "No Plan";
                    return AdminDashboardStatsDto.RecentTenantItem.builder()
                            .id(t.getId() != null ? t.getId().toString() : null)
                            .name(t.getName())
                            .displayName(t.getDisplayName())
                            .active(t.isActive())
                            .createdAt(t.getCreatedAt() != null ? t.getCreatedAt().toString() : null)
                            .planCode(planCode)
                            .planName(planName)
                            .build();
                })
                .collect(Collectors.toList());

        Map<String, Object> systemHealth = checkSystemHealth();

        return AdminDashboardStatsDto.builder()
                .totalTenants(totalTenants)
                .activeTenants(activeTenants)
                .suspendedTenants(suspendedTenants)
                .mrr(mrr)
                .activeSubscriptions(activeSubscriptions)
                .pendingInvoicesCount(pendingInvoicesCount)
                .planDistribution(planDistribution)
                .recentTenants(recentTenants)
                .systemHealth(systemHealth)
                .build();
    }

    public Map<String, Object> checkSystemHealth() {
        Map<String, ServiceTarget> targets = new LinkedHashMap<>();
        targets.put("craft-gateway-service", new ServiceTarget("thamanicraft-gateway-1", 8082));
        targets.put("craft-identity-service", new ServiceTarget("127.0.0.1", 8080));
        targets.put("craft-inventory-service", new ServiceTarget("thamanicraft-inventory-service", 8080));
        targets.put("craft-production-service", new ServiceTarget("thamanicraft-production-service", 8081));
        targets.put("craft-sales-service", new ServiceTarget("thamanicraft-sales-service", 8085));
        targets.put("craft-finance-service", new ServiceTarget("thamanicraft-finance-service", 8084));
        targets.put("postgres", new ServiceTarget("postgres", 5432));
        targets.put("rabbitmq", new ServiceTarget("rabbitmq", 5672));

        Map<String, Object> services = new ConcurrentHashMap<>();
        targets.entrySet().parallelStream().forEach(entry -> {
            ServiceTarget target = entry.getValue();
            Map<String, Object> result = probeService(target.host, target.port, 800);
            services.put(entry.getKey(), result);
        });

        boolean anyDown = services.values().stream()
                .filter(Map.class::isInstance)
                .map(m -> (Map<?, ?>) m)
                .anyMatch(m -> "DOWN".equals(m.get("status")));

        Map<String, Object> health = new HashMap<>();
        health.put("status", anyDown ? "DEGRADED" : "UP");
        health.put("services", services);
        health.put("components", services);
        health.put("checkedAt", java.time.Instant.now().toString());
        return health;
    }

    private Map<String, Object> probeService(String host, int port, int timeoutMs) {
        long start = System.currentTimeMillis();
        Map<String, Object> res = new HashMap<>();
        res.put("port", port);
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            long latency = System.currentTimeMillis() - start;
            res.put("status", "UP");
            res.put("latencyMs", latency);
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            res.put("status", "DOWN");
            res.put("latencyMs", latency);
            res.put("error", e.getMessage() != null ? e.getMessage() : "Connection failed");
        }
        return res;
    }

    private record ServiceTarget(String host, int port) {}
}
