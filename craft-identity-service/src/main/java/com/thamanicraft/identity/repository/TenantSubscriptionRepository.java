package com.thamanicraft.identity.repository;

import com.thamanicraft.identity.entity.TenantSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantSubscriptionRepository extends JpaRepository<TenantSubscription, UUID> {
    Optional<TenantSubscription> findByTenantIdAndStatus(UUID tenantId, String status);
    List<TenantSubscription> findByTenantId(UUID tenantId);

    @Query("SELECT ts FROM TenantSubscription ts JOIN FETCH ts.plan JOIN FETCH ts.tenant WHERE ts.status = 'ACTIVE'")
    List<TenantSubscription> findAllActiveWithPlanAndTenant();

    @Query("SELECT ts FROM TenantSubscription ts JOIN FETCH ts.plan JOIN FETCH ts.tenant")
    List<TenantSubscription> findAllWithPlanAndTenant();
}
