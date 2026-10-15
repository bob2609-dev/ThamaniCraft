import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Sun, Moon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useTheme } from '../ThemeContext';
import api from '../utils/api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/admin/auth/login', {
        email: values.email,
        password: values.password,
        tenant: 'admin'
      });
      
      if (response.data.token) {
        login(response.data.token);
        message.success('Login successful');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      const detail = error.response?.data?.detail || error.response?.data?.message;
      let errorMsg = 'The email or password is not correct.';
      if (detail && detail !== 'Invalid credentials') {
        errorMsg = detail;
      }
      message.error(`Login failed. ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative p-4 transition-colors">
      {/* Theme toggle switch */}
      <div className="absolute top-6 right-6">
        <Button
          type="text"
          shape="circle"
          size="large"
          onClick={toggleTheme}
          icon={isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
          className="bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm"
          title="Toggle light / dark mode"
        />
      </div>

      <Card className="w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl mx-4 bg-white dark:bg-slate-800 transition-colors">
        <div className="text-center mb-8">
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
              boxShadow: isDark ? '0 0 24px rgba(245, 158, 11, 0.25), 0 4px 12px rgba(0, 0, 0, 0.35)' : 'none',
              padding: 10,
              margin: '0 auto 16px',
              transition: 'all 0.3s ease'
            }}
          >
            <img src="/assets/logo.png" alt="ThamaniCraft Logo" style={{ height: 60, width: 'auto', objectFit: 'contain' }} />
          </div>

          <h1 className="text-3xl font-bold">
            <span className="text-slate-900 dark:text-slate-100 font-medium">Thamani</span>
            <span className="text-amber-600 dark:text-amber-500 font-extrabold">Craft</span>
          </h1>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
              Platform Administration
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm">Sign in to the system management portal</p>
        </div>

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your Email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined className="text-slate-400" />} 
              placeholder="Email address" 
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-slate-400" />}
              placeholder="Password"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item className="mt-6 mb-0">
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full h-12 rounded-lg font-semibold bg-amber-600 hover:bg-amber-700" 
              loading={loading}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
