package com.thamanicraft.identity.repository;

import com.thamanicraft.identity.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
    java.util.List<Role> findByTenantId(java.util.UUID tenantId);
    Optional<Role> findByIdAndTenantId(Long id, java.util.UUID tenantId);
}
