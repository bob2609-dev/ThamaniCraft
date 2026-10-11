package com.thamanicraft.identity.controller;

import com.thamanicraft.identity.entity.PlatformConfiguration;
import com.thamanicraft.identity.service.PlatformConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/configs")
@RequiredArgsConstructor
public class PlatformConfigurationController {

    private final PlatformConfigurationService service;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<PlatformConfiguration>> getAllConfigs() {
        return ResponseEntity.ok(service.getAllConfigs());
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<PlatformConfiguration> updateConfig(
            @PathVariable String key,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(service.updateConfig(key, payload.get("configValue")));
    }
}
