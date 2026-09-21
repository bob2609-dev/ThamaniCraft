package com.thamanicraft.security.context;

import java.util.UUID;

public class TenantContext {
    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<UUID> CURRENT_USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_USER_NAME = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> HAS_POS = new ThreadLocal<>();
    private static final ThreadLocal<Integer> MAX_INVENTORY_ITEMS = new ThreadLocal<>();

    public static UUID getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void setCurrentTenant(UUID tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static UUID getCurrentUserId() {
        return CURRENT_USER_ID.get();
    }

    public static void setCurrentUserId(UUID userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static String getCurrentUserName() {
        return CURRENT_USER_NAME.get();
    }

    public static void setCurrentUserName(String userName) {
        CURRENT_USER_NAME.set(userName);
    }

    public static Boolean getHasPos() {
        return HAS_POS.get();
    }

    public static void setHasPos(Boolean hasPos) {
        HAS_POS.set(hasPos);
    }

    public static Integer getMaxInventoryItems() {
        return MAX_INVENTORY_ITEMS.get();
    }

    public static void setMaxInventoryItems(Integer maxItems) {
        MAX_INVENTORY_ITEMS.set(maxItems);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
        CURRENT_USER_ID.remove();
        CURRENT_USER_NAME.remove();
        HAS_POS.remove();
        MAX_INVENTORY_ITEMS.remove();
    }
}
