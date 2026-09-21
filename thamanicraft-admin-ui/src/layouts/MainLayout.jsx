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
  Moon
} from 'lucide-react';
import { useTheme } from '../ThemeContext';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

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
        <div className="flex items-center justify-center h-16 m-4">
          <Title level={4} className="!m-0 whitespace-nowrap overflow-hidden transition-all duration-300">
            {collapsed ? 'TC' : 'ThamaniCraft Admin'}
          </Title>
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
            {/* Future: User Profile Dropdown */}
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          </div>
        </Header>
        <Content className="m-6 p-6 min-h-[280px]" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
