export const MODULE_NAMES = {
  inventory: 'Inventory',
  recipes: 'Recipes & BOM',
  production: 'Production',
  sales: 'Sales & Dispatch',
  pos: 'Point of Sale (POS)',
  procurement: 'Procurement',
  expenses: 'Expenses',
  finance: 'Finance & Ledgers',
  customers: 'Customers',
  reports: 'Reports',
};

export const AVAILABLE_MODULES = [
  { 
    label: 'Inventory', 
    value: 'inventory',
    description: 'Raw materials, stock balances, Goods Receipts (GRN), and valuation.'
  },
  { 
    label: 'Recipes & BOM', 
    value: 'recipes',
    description: 'Bill of Materials, ingredient cost simulation, preparation notes, and target margins.'
  },
  { 
    label: 'Production', 
    value: 'production',
    description: 'Manufacturing work orders, batch execution, and stage tracking.'
  },
  { 
    label: 'Sales & Dispatch', 
    value: 'sales',
    description: 'Customer wholesale orders, delivery tracking, and finished goods dispatch.'
  },
  { 
    label: 'Point of Sale (POS)', 
    value: 'pos',
    description: 'Fast cashier checkout, counter retail sales, and made-to-order fulfillment.'
  },
  { 
    label: 'Procurement', 
    value: 'procurement',
    description: 'Vendor purchasing, supplier order management, and receiving stock.'
  },
  { 
    label: 'Expenses', 
    value: 'expenses',
    description: 'Operational expense entries, bills, machinery CapEx, and overhead amortization.'
  },
  { 
    label: 'Finance & Ledgers', 
    value: 'finance',
    description: 'Double-entry accounting, General Ledger, accounts, and financial journals.'
  },
  { 
    label: 'Customers', 
    value: 'customers',
    description: 'Customer directory, contact profiles, delivery preferences, and order history.'
  },
  { 
    label: 'Reports', 
    value: 'reports',
    description: 'Sales margins, production yields, inventory valuation, and accounting ledgers.'
  },
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
