package com.thamanicraft.identity.repository;

import com.thamanicraft.identity.entity.PlatformPermission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformPermissionRepository extends JpaRepository<PlatformPermission, Long> {
}
