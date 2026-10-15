package com.thamanicraft.identity.repository;

import com.thamanicraft.identity.entity.SubscriptionInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionInvoiceRepository extends JpaRepository<SubscriptionInvoice, UUID> {
    List<SubscriptionInvoice> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<SubscriptionInvoice> findByStatusOrderByCreatedAtDesc(String status);
    long countByStatus(String status);
}
