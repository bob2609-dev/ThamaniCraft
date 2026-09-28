package com.thamanicraft.identity.controller;

import com.thamanicraft.identity.dto.CreateUserRequest;
import com.thamanicraft.identity.dto.RoleDto;
import com.thamanicraft.identity.dto.UserDto;
import com.thamanicraft.identity.entity.Role;
import com.thamanicraft.identity.entity.User;
import com.thamanicraft.identity.dto.ChangePasswordRequest;
import com.thamanicraft.identity.dto.CreateRoleRequest;
import com.thamanicraft.identity.dto.PermissionDto;
import com.thamanicraft.identity.entity.Permission;
import com.thamanicraft.identity.repository.PermissionRepository;
import com.thamanicraft.identity.repository.RoleRepository;
import com.thamanicraft.identity.repository.UserRepository;
import com.thamanicraft.security.context.TenantContext;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth/users")
public class UserController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, RoleRepository roleRepository,
            PermissionRepository permissionRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getUsers() {
        List<UserDto> users = userRepository.findByTenantId(TenantContext.getCurrentTenant())
                .stream()
                .map(u -> new UserDto(u.getId(), u.getName(), u.getEmail(),
                        u.getRole() != null ? u.getRole().getName() : "None", u.isActive()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/roles")
    public ResponseEntity<List<RoleDto>> getRoles() {
        List<RoleDto> roles = roleRepository.findByTenantId(TenantContext.getCurrentTenant())
                .stream()
                .map(r -> new RoleDto(r.getId(), r.getName(), r.isSystemRole(),
                        r.getPermissions().stream()
                                .map(p -> new PermissionDto(p.getId(), p.getName(), p.getDescription(),
                                        p.getDomainGroup()))
                                .collect(Collectors.toList())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(roles);
    }

    @PostMapping("/roles")
    public ResponseEntity<RoleDto> createRole(@Valid @RequestBody CreateRoleRequest request) {
        Role role = new Role();
        role.setName(request.name());
        role.setTenantId(TenantContext.getCurrentTenant());
        role.setSystemRole(false);

        List<Permission> permissions = permissionRepository.findAllById(request.permissionIds());
        role.setPermissions(new HashSet<>(permissions));

        roleRepository.save(role);

        return ResponseEntity.ok(new RoleDto(role.getId(), role.getName(), role.isSystemRole(),
                permissions.stream()
                        .map(p -> new PermissionDto(p.getId(), p.getName(), p.getDescription(), p.getDomainGroup()))
                        .collect(Collectors.toList())));
    }

    @GetMapping("/permissions")
    public ResponseEntity<List<PermissionDto>> getPermissions() {
        List<PermissionDto> permissions = permissionRepository.findAll()
                .stream()
                .map(p -> new PermissionDto(p.getId(), p.getName(), p.getDescription(), p.getDomainGroup()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(permissions);
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        Role role = roleRepository.findByIdAndTenantId(request.roleId(), TenantContext.getCurrentTenant())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role"));

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setTenantId(TenantContext.getCurrentTenant());

        userRepository.save(user);

        return ResponseEntity
                .ok(new UserDto(user.getId(), user.getName(), user.getEmail(), role.getName(), user.isActive()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        UUID userId = TenantContext.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("message", "User not authenticated"));
        }

        User user = userRepository.findByIdAndTenantId(userId, TenantContext.getCurrentTenant())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Incorrect old password"));
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{userId}/toggle-status")
    public ResponseEntity<Void> toggleUserStatus(@PathVariable UUID userId) {
        if (userId.equals(TenantContext.getCurrentUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot toggle your own status");
        }
        User user = userRepository.findByIdAndTenantId(userId, TenantContext.getCurrentTenant())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setActive(!user.isActive());
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }
}
