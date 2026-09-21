# SKILL-14: Frontend RBAC & JWT Token Patterns

**Scope:** Tenant UI (Next.js / React)
**Lesson Source:** ThamaniPoint — hardcoded "Demo User", email displayed instead of name, deprecated Ant Design props.

---

## 1. Custom `usePermissions` Hook

All permission checks in the frontend MUST go through a centralized hook that parses the JWT token once.

```javascript
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function usePermissions() {
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.permissions) setPermissions(payload.permissions);
        if (payload.role) setRole(payload.role);
      } catch (e) {
        console.error("Failed to parse token permissions", e);
      }
    }
  }, []);

  const hasPermission = (permission) => {
    if (role === 'OWNER') return true; // Super-admin bypass
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList) => {
    if (role === 'OWNER') return true;
    return permissionList.some(p => permissions.includes(p));
  };

  return { permissions, role, hasPermission, hasAnyPermission };
}
```

---

## 2. Sidebar Menu Filtering

The main layout MUST filter navigation items based on permissions so users only see modules they can access.

```javascript
const menuItems = [
    { key: '/', icon: <AppstoreOutlined />, label: 'Dashboard', permission: null },
    { key: '/pos', icon: <ShopOutlined />, label: 'Point of Sale', permission: 'PROCESS_SALES' },
    { key: '/sales', icon: <ShoppingCartOutlined />, label: 'Sales', permission: 'VIEW_SALES' },
    { key: '/products', icon: <TagsOutlined />, label: 'Products', permission: 'VIEW_PRODUCTS' },
    { key: '/logs', icon: <SafetyCertificateOutlined />, label: 'Audit Logs', permission: 'VIEW_LOGS' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings', permission: 'VIEW_SETTINGS' },
].filter(item => !item.permission || hasPermission(item.permission));
```

---

## 3. Route-Level Permission Guard

Beyond hiding sidebar items, the layout MUST also block rendering unauthorized routes if a user navigates directly via URL.

```javascript
const routeConfig = {
    '/pos': 'PROCESS_SALES',
    '/sales': 'VIEW_SALES',
    '/products': 'VIEW_PRODUCTS',
    '/logs': 'VIEW_LOGS',
    '/settings': 'VIEW_SETTINGS'
};

const requiredPermission = routeConfig[pathname];
const isAuthorized = !requiredPermission || hasPermission(requiredPermission);

return (
    <Content>
        {isAuthorized ? children : <ForbiddenView />}
    </Content>
);
```

---

## 4. Displaying User Identity from JWT

**NEVER hardcode user display names.** Always extract from the JWT token.

### JWT Claims Structure
```json
{
  "sub": "user@email.com",         // Email (authentication subject)
  "user_name": "John Doe",         // Display name (for UI)
  "user_id": "uuid-string",        // User UUID
  "role": "OWNER",                 // Role name
  "tenant_id": "uuid-string",      // Tenant UUID
  "permissions": ["VIEW_SALES", "PROCESS_SALES", ...]
}
```

### Correct Pattern
```javascript
const [currentUserName] = useState(() => {
    try {
        const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user_name || 'User';  // Use user_name, NOT sub (email)
        }
    } catch (e) {}
    return 'User';
});
```

### Anti-Pattern (DO NOT DO)
```javascript
// ❌ WRONG: Hardcoded name
<UserOutlined /> "Demo User"

// ❌ WRONG: Using email instead of name
return payload.sub || "User";

// ✅ CORRECT: Using the name claim
return payload.user_name || "User";
```

---

## 5. Role Management UI: Permission Grouping

When building a "Create/Edit Role" interface, group permissions by domain using a multi-column grid layout. Never present a flat list.

```javascript
const PERMISSION_GROUPS = {
    'PRODUCTS': ['VIEW_PRODUCTS', 'CREATE_PRODUCTS', 'UPDATE_PRODUCTS', 'DELETE_PRODUCTS'],
    'INVENTORY': ['VIEW_INVENTORY', 'ADJUST_INVENTORY'],
    'SALES': ['VIEW_SALES', 'PROCESS_SALES'],
    'PURCHASES': ['VIEW_PURCHASES', 'CREATE_PURCHASES'],
    'EXPENSES': ['VIEW_EXPENSES', 'CREATE_EXPENSES', 'APPROVE_EXPENSES'],
    'REPORTS': ['VIEW_REPORTS', 'VIEW_FINANCIAL_REPORTS'],
    'SETTINGS': ['VIEW_SETTINGS', 'MANAGE_USERS', 'MANAGE_ROLES'],
    'LOGS': ['VIEW_LOGS'],
};

// Render as a responsive grid with Checkbox.Group per domain
<Row gutter={[16, 16]}>
    {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
        <Col xs={24} sm={12} md={8} key={group}>
            <Text strong>{group}</Text>
            <Checkbox.Group options={perms} />
        </Col>
    ))}
</Row>
```

---

## 6. Ant Design Deprecation Watchlist

Track and prevent deprecated Ant Design APIs:

| Deprecated | Replacement | Version |
| :--- | :--- | :--- |
| `<Space direction="vertical">` | `<Space orientation="vertical">` | AntD v5.x |
| `<Modal destroyOnClose>` | `<Modal destroyOnHidden>` | AntD v5.x |
| `message.xxx()` (static) | `const { message } = App.useApp()` | AntD v5.x |

### Rule
Always use the non-deprecated API. When encountering console warnings about deprecated props, fix immediately — they indicate the prop will be removed in the next major version.
