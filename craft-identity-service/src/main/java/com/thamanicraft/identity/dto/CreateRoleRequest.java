package com.thamanicraft.identity.dto;

import java.util.List;

public record CreateRoleRequest(
        String name,
        List<Long> permissionIds
) {}
