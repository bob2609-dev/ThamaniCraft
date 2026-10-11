package com.thamanicraft.identity.repository;

import com.thamanicraft.identity.entity.PlatformConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformConfigurationRepository extends JpaRepository<PlatformConfiguration, String> {
}
