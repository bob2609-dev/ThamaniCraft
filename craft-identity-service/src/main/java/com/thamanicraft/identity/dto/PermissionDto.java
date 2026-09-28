package com.thamanicraft.identity.dto;

public record PermissionDto(
        Long id,
        String name,
        String description,
        String domainGroup
) {}
