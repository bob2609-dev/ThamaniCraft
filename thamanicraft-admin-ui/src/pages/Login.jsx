import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-lg border-0 rounded-2xl mx-4">
        <div className="text-center mb-8">
          <img src="/assets/logo.png" alt="ThamaniCraft Logo" className="h-16 mx-auto mb-4 block" />
          <h1 className="text-3xl font-bold">
            <span style={{ color: '#323639', fontWeight: 400 }}>Thamani</span>
            <span style={{ color: '#c99e5e', fontWeight: 800 }}>Craft</span>
          </h1>
          <h2 className="text-xl font-semibold mt-1" style={{ color: '#323639' }}>Admin</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3">Platform Administration Portal</p>
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
