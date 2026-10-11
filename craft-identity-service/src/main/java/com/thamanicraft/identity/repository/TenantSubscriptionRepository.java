package com.thamanicraft.identity.repository;

import com.thamanicraft.identity.entity.TenantSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantSubscriptionRepository extends JpaRepository<TenantSubscription, UUID> {
    Optional<TenantSubscription> findByTenantIdAndStatus(UUID tenantId, String status);
    List<TenantSubscription> findByTenantId(UUID tenantId);
}
