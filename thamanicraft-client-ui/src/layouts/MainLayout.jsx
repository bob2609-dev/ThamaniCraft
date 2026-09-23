import { useState } from 'react';
import { Layout, Menu, Button, Typography, theme as antdTheme, Dropdown, Space, Avatar } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  LayoutDashboard,
  Package,
  BookOpen,
  Factory,
  ShoppingCart,
  Settings,
  Menu as MenuIcon,
  X,
  Sun,
  Moon,
  Truck,
  Users,
  LogOut,
  User
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import usePermissions from '../hooks/usePermissions';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions, role, userName, hasPermission } = usePermissions();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = antdTheme.useToken();

  const handleLogout = () => {
    Cookies.remove('tenant_token');
    localStorage.removeItem('tenant_token');
    window.location.href = '/login';
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  const menuItems = [
    {
      key: '/',
      icon: <LayoutDashboard size={18} />,
      label: 'Dashboard',
      permission: null // Everyone can see dashboard
    },
    {
      key: '/inventory',
      icon: <Package size={18} />,
      label: 'Inventory',
      permission: 'VIEW_INVENTORY'
    },
    {
      key: '/recipes',
      icon: <BookOpen size={18} />,
      label: 'Recipes & BOM',
      permission: 'VIEW_RECIPES'
    },
    {
      key: '/production',
      icon: <Factory size={18} />,
      label: 'Production',
      permission: 'VIEW_PRODUCTION'
    },
    {
      key: '/sales',
      icon: <ShoppingCart size={18} />,
      label: 'Sales & Dispatch',
      permission: 'VIEW_SALES'
    },
    {
      key: '/procurement',
      icon: <Truck size={18} />,
      label: 'Procurement',
      permission: 'VIEW_PURCHASES' // Assume VIEW_PURCHASES mapped for procurement
    },
    {
      key: '/assets',
      icon: <Factory size={18} />,
      label: 'Assets & Overheads',
      permission: 'VIEW_FINANCE'
    },
    {
      key: '/customers',
      icon: <Users size={18} />,
      label: 'Customers',
      permission: 'VIEW_SALES' // Typically tied to sales
    },
    {
      key: '/reports',
      icon: <LayoutDashboard size={18} />,
      label: 'Reports',
      permission: 'VIEW_REPORTS'
    },
    {
      key: '/settings',
      icon: <Settings size={18} />,
      label: 'Settings',
      permission: 'MANAGE_USERS'
    },
  ].filter(item => !item.permission || hasPermission(item.permission));

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
        theme={isDarkMode ? 'dark' : 'light'}
        className="border-r border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-center h-16 m-4">
          <Title level={4} className="!m-0 whitespace-nowrap overflow-hidden transition-all duration-300">
            {collapsed ? 'TC' : 'ThamaniCraft'}
          </Title>
        </div>
        <Menu
          theme={isDarkMode ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname.startsWith('/recipes/') ? '/recipes' : location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header 
          className="flex items-center justify-between px-4"
          style={{ background: colorBgContainer }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuIcon /> : <X />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg w-16 h-16"
          />
          <div className="flex items-center gap-4">
            <Button 
              type="text" 
              onClick={toggleTheme}
              className="flex items-center justify-center"
              icon={isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div className="cursor-pointer flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors leading-normal">
                <Avatar icon={<User size={16} />} size="small" className="flex items-center justify-center" />
                <Text strong className="m-0 leading-none">{userName}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="m-6 p-6 min-h-[280px]" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
