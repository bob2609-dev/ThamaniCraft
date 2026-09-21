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
      isAuthenticated: false
    };
  });

  const hasPermission = (permission) => {
    if (authState.role === 'OWNER') return true; // Super-admin bypass
    return authState.permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList) => {
    if (authState.role === 'OWNER') return true;
    return permissionList.some(p => authState.permissions.includes(p));
  };

  return { ...authState, hasPermission, hasAnyPermission };
}
