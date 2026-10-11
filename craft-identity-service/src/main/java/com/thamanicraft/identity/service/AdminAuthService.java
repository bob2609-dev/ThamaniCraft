package com.thamanicraft.identity.service;

import com.thamanicraft.identity.dto.AuthRequest;
import com.thamanicraft.identity.dto.AuthResponse;

public interface AdminAuthService {
    AuthResponse login(AuthRequest request);
}
