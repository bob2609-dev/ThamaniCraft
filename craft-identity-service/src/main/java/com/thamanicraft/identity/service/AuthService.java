package com.thamanicraft.identity.service;

import com.thamanicraft.identity.dto.AuthRequest;
import com.thamanicraft.identity.dto.AuthResponse;

public interface AuthService {
    AuthResponse login(AuthRequest request);
}
