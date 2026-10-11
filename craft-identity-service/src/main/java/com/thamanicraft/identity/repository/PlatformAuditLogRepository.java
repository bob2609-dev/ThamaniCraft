package com.thamanicraft.identity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.thamanicraft.identity.entity.PlatformAuditLog;
import java.util.List;

public interface PlatformAuditLogRepository extends JpaRepository<PlatformAuditLog, Long> {
    List<PlatformAuditLog> findAllByOrderByCreatedAtDesc();
}
