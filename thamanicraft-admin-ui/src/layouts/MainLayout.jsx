import { useState } from 'react';
import { Layout, Menu, Button, Typography, theme as antdTheme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  FileText,
  Settings,
  Menu as MenuIcon,
  X,
  Sun,
  Moon,
  LogOut,
  User
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import useAuthStore from '../store/authStore';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = antdTheme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <LayoutDashboard size={18} />,
      label: 'Dashboard',
    },
    {
      key: '/tenants',
      icon: <Building2 size={18} />,
      label: 'Tenants',
    },
    {
      key: '/subscriptions',
      icon: <CreditCard size={18} />,
      label: 'Subscriptions',
    },
    {
      key: '/logs',
      icon: <FileText size={18} />,
      label: 'System Logs',
    },
    {
      key: '/settings',
      icon: <Settings size={18} />,
      label: 'Global Settings',
    },
    {
      key: '/profile',
      icon: <User size={18} />,
      label: 'My Profile',
    },
  ];

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
        <div className={`flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ${collapsed ? 'h-16' : 'py-6'}`}>
          <img src="/assets/logo.png" alt="Logo" className={`transition-all duration-300 ${collapsed ? 'h-8' : 'h-10 mb-2'}`} />
          {!collapsed && (
            <div className="text-center">
              <div className="text-lg leading-none whitespace-nowrap">
                <span className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 400 }}>Thamani</span>
                <span style={{ color: '#c99e5e', fontWeight: 800 }}>Craft</span>
              </div>
              <div className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-100">
                Admin
              </div>
            </div>
          )}
        </div>
        <Menu
          theme={isDarkMode ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
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
            {/* User Profile Dropdown */}
            <Button
              type="text"
              className="flex items-center gap-2"
              onClick={logout}
              icon={<LogOut size={16} />}
            >
              <span className="hidden sm:inline">{user?.email || 'Admin'}</span>
            </Button>
          </div>
        </Header>
        <Content className="m-6 p-6 min-h-[280px]" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
