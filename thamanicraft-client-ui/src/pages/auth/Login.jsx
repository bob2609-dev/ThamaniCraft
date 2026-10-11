import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);

  const tenantName = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname.split('.')[0];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        tenant: tenantName
      };

      // In production, point to the actual gateway auth endpoint
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/assets/logo.png" alt="ThamaniCraft Logo" style={{ display: 'block', margin: '0 auto 16px', height: 64 }} />
          <Title level={3} style={{ margin: 0 }}>
            <span style={{ color: '#323639', fontWeight: 400 }}>Thamani</span>
            <span style={{ color: '#c99e5e', fontWeight: 800 }}>Craft</span>
          </Title>
          <Title level={4} style={{ margin: 0, marginTop: 4, color: '#323639' }}>{tenantName}</Title>
          <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>Sign in to your account</Text>
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
