# SKILL-08: UI/UX Design System & Component Architecture

**Target Project:** ThamaniCraft  
**Frontend Stack:** ReactJS 18+ (Vite SPA) + Ant Design v5 + Tailwind CSS + Lucide React + Recharts  
**Design Philosophy:** *Industrial Precision meets Artisanal Simplicity.*  

---

## 1. Color Palette & Design Tokens

ThamaniCraft balances high-velocity touch operation on kitchen tablets with an executive manufacturing ERP back-office.

```css
/* Light Theme (Porcelain & Slate Navy) */
:root {
  /* Brand Primary & Accents */
  --color-primary: #D97706;         /* Artisan Amber / Warm Copper */
  --color-primary-hover: #B45309;
  --color-primary-active: #92400E;
  
  /* Sidebar & Navigation */
  --sidebar-bg: #0F172A;            /* Deep Midnight Slate */
  --sidebar-hover: #1E293B;
  --sidebar-active: #D97706;
  --sidebar-text: #94A3B8;
  --sidebar-text-active: #FFFFFF;

  /* Surfaces & Backgrounds */
  --bg-app: #F8FAFC;                /* Crisp light slate canvas */
  --bg-surface: #FFFFFF;            /* Pure white card surface */
  --border-subtle: #E2E8F0;
  --border-strong: #CBD5E1;

  /* Typography */
  --text-primary: #0F172A;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;

  /* Functional Status */
  --status-success: #10B981;        /* In Stock / Batch Complete */
  --status-warning: #F59E0B;        /* Low Stock / In Progress */
  --status-danger: #EF4444;         /* Out of Stock / Scrap Alert */
  --status-info: #0284C7;           /* Scheduled / Awaiting GRN */
}

/* Dark Theme (Charcoal Industrial) */
.dark {
  --color-primary: #F59E0B;
  --color-primary-hover: #D97706;
  --color-primary-active: #B45309;

  --sidebar-bg: #020617;
  --sidebar-hover: #0F172A;
  --sidebar-active: #F59E0B;
  --sidebar-text: #94A3B8;
  --sidebar-text-active: #FFFFFF;

  --bg-app: #0B1120;
  --bg-surface: #1E293B;
  --border-subtle: #334155;
  --border-strong: #475569;

  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
}
```

---

## 2. Ant Design v5 Context & App Wrapper Standard

All React components MUST consume message, notification, and modal dialogs via `App.useApp()` to inherit dynamic theme tokens seamlessly without static context warnings:

```jsx
import React from 'react';
import { ConfigProvider, theme as antdTheme, App } from 'antd';
import { useTheme } from './ThemeContext';

export default function AntdProvider({ children }) {
  const { theme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#D97706',
          borderRadius: 8,
          colorBgBase: theme === 'dark' ? '#0B1120' : '#F8FAFC',
          colorBgContainer: theme === 'dark' ? '#1E293B' : '#FFFFFF',
          colorTextBase: theme === 'dark' ? '#F8FAFC' : '#0F172A',
          colorBorder: theme === 'dark' ? '#334155' : '#E2E8F0',
        }
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}
```

---

## 3. High-Density Touch Targets (Kitchen Mode)

For workshop tablets and kitchen displays (where operators may have gloved or flour-dusted hands):
- Minimum button touch targets: **48px x 48px**.
- High-contrast numerical stepper buttons (`+` / `-`) for batch quantity adjustments.
- Instant single-tap status progression buttons (`Start Mixing` -> `In Oven` -> `Finished`).
- Audio feedback chime upon batch completion or scanner read.

---

## 4. Currency, Number & Yield Formatting

- **Currency Standard:** Tanzanian Shilling `TZS 1,234,567`.
- **Weight / Unit Precision:**
  - Bulk / Kitchen weights: 4 decimal places for base units (`0.2500 kg` or `250.0 g`).
  - Unit costs: 2 decimal places (`TZS 1.80 / g`).
- **Yield & Efficiency Badges:**
  - `100% - 98%`: Green (`badge-success`)
  - `97% - 92%`: Amber (`badge-warning`)
  - `< 92%`: Red (`badge-danger`) with immediate scrap reason prompt.\n