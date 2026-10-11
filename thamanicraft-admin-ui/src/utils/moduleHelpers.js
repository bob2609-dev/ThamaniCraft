export const MODULE_NAMES = {
  inventory: 'Inventory',
  recipes: 'Recipes & BOM',
  production: 'Production',
  sales: 'Sales & Dispatch',
  procurement: 'Procurement',
  expenses: 'Expenses',
  finance: 'Finance & Ledgers',
  customers: 'Customers',
  reports: 'Reports',
};

export const AVAILABLE_MODULES = [
  { label: 'Inventory', value: 'inventory' },
  { label: 'Recipes & BOM', value: 'recipes' },
  { label: 'Production', value: 'production' },
  { label: 'Sales & Dispatch', value: 'sales' },
  { label: 'Procurement', value: 'procurement' },
  { label: 'Expenses', value: 'expenses' },
  { label: 'Finance & Ledgers', value: 'finance' },
  { label: 'Customers', value: 'customers' },
  { label: 'Reports', value: 'reports' },
];

export const parseModules = (rawModules) => {
  if (!rawModules) return [];
  if (Array.isArray(rawModules)) return rawModules;
  if (typeof rawModules === 'string') {
    const trimmed = rawModules.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(m => String(m).trim()).filter(Boolean);
      } catch (e) {
        // Fallback to regex split
      }
    }
    return trimmed
      .replace(/[\[\]"]/g, '')
      .split(',')
      .map(m => m.trim())
      .filter(Boolean);
  }
  return [];
};

export const formatModuleName = (code) => {
  if (!code) return '';
  const clean = code.toLowerCase().trim();
  return MODULE_NAMES[clean] || (clean.charAt(0).toUpperCase() + clean.slice(1));
};
