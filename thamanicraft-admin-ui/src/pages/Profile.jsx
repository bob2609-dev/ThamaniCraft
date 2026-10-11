import React from 'react';
import { Typography, Card, Form, Input, Button, message } from 'antd';
import { changePassword } from '../utils/identityApi';

const { Title } = Typography;

export default function Profile() {
  return (
    <div>
      <Title level={2}>My Profile</Title>
      
      <Card style={{ maxWidth: 600 }} title="Change Password">
        <Form 
          layout="vertical" 
          onFinish={async (values) => {
            if (values.newPassword !== values.confirmPassword) {
              message.error("New passwords do not match!");
              return;
            }
            try {
              await changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });
              message.success("Password changed successfully!");
            } catch (error) {
              message.error(error.message || "Failed to change password");
            }
          }}
        >
          <Form.Item name="oldPassword" label="Current Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label="Confirm New Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Change Password</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
