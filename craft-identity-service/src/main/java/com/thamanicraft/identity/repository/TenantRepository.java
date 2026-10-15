package com.thamanicraft.identity.repository;

import com.thamanicraft.identity.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findByName(String name);

    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.isActive = true")
    long countActive();

    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.isActive = false")
    long countSuspended();

    @Query("SELECT t FROM Tenant t ORDER BY t.createdAt DESC")
    List<Tenant> findAllOrderByCreatedAtDesc();
}
