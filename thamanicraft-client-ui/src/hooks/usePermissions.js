import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function usePermissions() {
  const [authState, setAuthState] = useState(() => {
    const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          return {
            permissions: payload.permissions || [],
            role: payload.role || null,
            userName: payload.user_name || 'User',
            tenantActive: payload.tenant_active !== false,
            modules: payload.modules || [],
            planCode: payload.plan_code || 'FREE',
            isAuthenticated: true
          };
        } else {
          Cookies.remove('tenant_token');
          localStorage.removeItem('tenant_token');
        }
      } catch (e) {
        console.error("Failed to parse token", e);
      }
    }
    return {
      permissions: [],
      role: null,
      userName: 'User',
      tenantActive: false,
      modules: [],
      planCode: 'FREE',
      isAuthenticated: false
    };
  });

  const hasPermission = (permission) => {
    if (authState.role === 'OWNER') return true; // Super-admin bypass for company-level permissions
    return authState.permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList) => {
    if (authState.role === 'OWNER') return true;
    return permissionList.some(p => authState.permissions.includes(p));
  };

  const hasModule = (moduleKey) => {
    if (!moduleKey) return true;
    if (authState.role === 'SUPER_ADMIN') return true;
    const normalized = moduleKey.toLowerCase();
    
    // If no modules array is present in an older token, default to allowing
    if (!authState.modules || authState.modules.length === 0) return true;

    // Derived module mappings
    if (normalized === 'procurement' && authState.modules.includes('inventory')) return true;
    if (normalized === 'customers' && authState.modules.includes('sales')) return true;
    if (normalized === 'expenses' && (authState.modules.includes('finance') || authState.modules.includes('expenses'))) return true;

    return authState.modules.includes(normalized);
  };

  return { ...authState, hasPermission, hasAnyPermission, hasModule };
}

export { usePermissions };
