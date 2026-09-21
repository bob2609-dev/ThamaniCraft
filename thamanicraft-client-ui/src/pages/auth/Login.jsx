import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);


  const onFinish = async (values) => {
    setLoading(true);
    try {
      // In production, point to the actual gateway auth endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: Subdomain is usually passed automatically by browser/Nginx,
          // but we can pass it if we were doing custom subdomain logic via headers
        },
        body: JSON.stringify(values),
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
        const err = await response.text();
        message.error(`Login failed: ${err || response.statusText}`);
      }
    } catch (error) {
      console.error(error);
      message.error('Network error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>ThamaniCraft</Title>
          <Text type="secondary">Sign in to your account</Text>
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
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
