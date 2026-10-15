package com.thamanicraft.identity.repository;

import com.thamanicraft.identity.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {
    Optional<SubscriptionPlan> findByCode(String code);
    
    @org.springframework.data.jpa.repository.Query("SELECT p FROM SubscriptionPlan p WHERE p.isActive = true AND p.isVisibleToCustomers = true ORDER BY p.monthlyPrice ASC")
    java.util.List<SubscriptionPlan> findAllPublicPlans();
}
