package com.thamanicraft.identity.repository;

import com.thamanicraft.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    java.util.List<User> findByTenantId(UUID tenantId);
    Optional<User> findByIdAndTenantId(UUID id, UUID tenantId);
}
