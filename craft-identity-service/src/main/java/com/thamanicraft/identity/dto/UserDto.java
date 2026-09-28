package com.thamanicraft.identity.dto;

import java.util.UUID;

public record UserDto(
    UUID id,
    String name,
    String email,
    String roleName,
    boolean isActive
) {}
