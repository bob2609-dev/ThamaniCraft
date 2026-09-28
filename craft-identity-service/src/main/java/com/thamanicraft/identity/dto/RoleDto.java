package com.thamanicraft.identity.dto;

import java.util.List;

public record RoleDto(
    Long id,
    String name,
    boolean isSystemRole,
    List<PermissionDto> permissions
) {}
