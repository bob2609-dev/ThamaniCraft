import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Sun, Moon } from 'lucide-react';
import Cookies from 'js-cookie';
import { useTheme } from '../../ThemeContext';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const tenantName = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname.split('.')[0];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        tenant: tenantName
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        
        // Save token in cookie
        Cookies.set('tenant_token', token, { expires: 1 });
        localStorage.setItem('tenant_token', token);
        
        message.success('Login successful!');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        const errText = await response.text();
        let errorMsg = 'The email or password is not correct.';
        try {
          const parsed = JSON.parse(errText);
          if (parsed.detail) {
            errorMsg = parsed.detail === 'Invalid credentials' 
              ? 'The email or password is not correct.' 
              : parsed.detail;
          }
        } catch (e) {
          if (errText) errorMsg = errText;
        }
        message.error(`Login failed. ${errorMsg}`);
      }
    } catch (error) {
      console.error(error);
      message.error('Network error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: isDark ? '#0B1120' : '#F1F5F9',
        position: 'relative',
        transition: 'background-color 0.3s ease',
        padding: '16px'
      }}
    >
      {/* Theme toggle switch */}
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <Button
          type="text"
          shape="circle"
          size="large"
          onClick={toggleTheme}
          icon={isDark ? <Sun size={20} style={{ color: '#FBBF24' }} /> : <Moon size={20} style={{ color: '#64748B' }} />}
          style={{
            background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
          title="Toggle light / dark mode"
        />
      </div>

      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          background: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          boxShadow: isDark
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* Logo badge with high contrast background in dark mode */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: isDark ? '#FFFFFF' : 'transparent',
              boxShadow: isDark
                ? '0 0 24px rgba(245, 158, 11, 0.25), 0 4px 12px rgba(0, 0, 0, 0.35)'
                : 'none',
              padding: 10,
              margin: '0 auto 16px',
              transition: 'all 0.3s ease'
            }}
          >
            <img
              src="/assets/logo.png"
              alt="ThamaniCraft Logo"
              style={{
                display: 'block',
                height: 60,
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>

          <Title level={3} style={{ margin: 0 }}>
            <span style={{ color: isDark ? '#F8FAFC' : '#1E293B', fontWeight: 500, transition: 'color 0.3s' }}>
              Thamani
            </span>
            <span style={{ color: isDark ? '#F59E0B' : '#D97706', fontWeight: 800, transition: 'color 0.3s' }}>
              Craft
            </span>
          </Title>

          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '3px 12px',
                borderRadius: 16,
                background: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.08)',
                color: isDark ? '#FBBF24' : '#D97706',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.02em',
                border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(217, 119, 6, 0.15)'
              }}
            >
              {tenantName}
            </span>
          </div>

          <Text style={{ display: 'block', marginTop: 10, color: isDark ? '#94A3B8' : '#64748B', fontSize: 14 }}>
            Sign in to your account
          </Text>
        </div>
        
        <Form
          name="login_form"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your Email!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: isDark ? '#94A3B8' : '#9CA3AF' }} />}
              placeholder="Email"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: isDark ? '#94A3B8' : '#9CA3AF' }} />}
              placeholder="Password"
            />
          </Form.Item>
          
          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                background: '#D97706',
                borderColor: '#D97706'
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
