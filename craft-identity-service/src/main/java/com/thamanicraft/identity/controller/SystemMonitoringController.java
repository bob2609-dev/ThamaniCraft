package com.thamanicraft.identity.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.thamanicraft.identity.dto.AdminDashboardStatsDto;
import com.thamanicraft.identity.entity.PlatformAuditLog;
import com.thamanicraft.identity.repository.PlatformAuditLogRepository;
import com.thamanicraft.identity.service.AdminDashboardService;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class SystemMonitoringController {

    private final PlatformAuditLogRepository auditLogRepository;
    private final AdminDashboardService adminDashboardService;

    @GetMapping("/metrics/dashboard")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('VIEW_SYSTEM_LOGS')")
    public ResponseEntity<AdminDashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(adminDashboardService.getDashboardStats());
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('VIEW_SYSTEM_LOGS')")
    public ResponseEntity<List<PlatformAuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/metrics/health")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('VIEW_SYSTEM_LOGS')")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        return ResponseEntity.ok(adminDashboardService.checkSystemHealth());
    }
}
