package com.thamanicraft.identity.dto;

public record ChangePasswordRequest(
        String oldPassword,
        String newPassword
) {}
