package com.thamanicraft.identity.service;

import com.thamanicraft.identity.entity.PlatformConfiguration;
import com.thamanicraft.identity.repository.PlatformConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlatformConfigurationService {

    private final PlatformConfigurationRepository repository;

    public List<PlatformConfiguration> getAllConfigs() {
        return repository.findAll();
    }

    public PlatformConfiguration getConfig(String key) {
        return repository.findById(key)
                .orElseThrow(() -> new RuntimeException("Configuration key not found"));
    }

    public PlatformConfiguration updateConfig(String key, String value) {
        PlatformConfiguration config = getConfig(key);
        config.setConfigValue(value);
        return repository.save(config);
    }
}
