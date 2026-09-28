import React, { useState, useEffect } from 'react';
import { Typography, Tabs, Card, Form, Input, Button, Table, Modal, Select, message, Space, Tag, Row, Col, Checkbox } from 'antd';
import { UserOutlined, SettingOutlined, LockOutlined } from '@ant-design/icons';
import { fetchUsers, fetchRoles, fetchPermissions, createUser, createRole, toggleUserStatus } from '../services/identityApi';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [roleForm] = Form.useForm();
  
  // General settings state with localStorage persistence
  const [generalSettings, setGeneralSettings] = useState(() => {
    const saved = localStorage.getItem('thamanicraft_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback if parsing fails
      }
    }
    return {
      businessName: 'ThamaniCraft Ltd',
      currency: 'TZS',
      timezone: 'Africa/Dar_es_Salaam'
    };
  });

  useEffect(() => {
    loadUsersAndRoles();
  }, []);

  const loadUsersAndRoles = async () => {
    setLoading(true);
    try {
      const [u, r, p] = await Promise.all([
        fetchUsers().catch(() => []),
        fetchRoles().catch(() => []),
        fetchPermissions().catch(() => [])
      ]);
      setUsers(u);
      setRoles(r);
      setPermissions(p);
    } catch (e) {
      console.error(e);
      message.error("Failed to load users or roles.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (values) => {
    try {
      await createUser(values);
      message.success("User created successfully!");
      setIsModalVisible(false);
      form.resetFields();
      loadUsersAndRoles();
    } catch (error) {
      message.error(error.message || "Failed to create user");
    }
  };

  const handleCreateRole = async (values) => {
    try {
      await createRole(values);
      message.success("Role created successfully!");
      setIsRoleModalVisible(false);
      roleForm.resetFields();
      loadUsersAndRoles();
    } catch (error) {
      message.error(error.message || "Failed to create role");
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await toggleUserStatus(userId);
      message.success("User status toggled successfully!");
      loadUsersAndRoles();
    } catch (error) {
      message.error(error.message || "Failed to toggle user status");
    }
  };

  const handleSaveGeneralSettings = (values) => {
    setGeneralSettings(values);
    localStorage.setItem('thamanicraft_settings', JSON.stringify(values));
    message.success("General settings saved successfully");
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Role', dataIndex: 'roleName', render: r => <Tag color="blue">{r}</Tag> },
    { title: 'Status', dataIndex: 'isActive', render: active => (
      <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag>
    )},
    { title: 'Action', key: 'action', render: (_, record) => (
      <Button 
        type="link" 
        danger={record.isActive} 
        onClick={() => handleToggleUserStatus(record.id)}
      >
        {record.isActive ? 'Disable' : 'Enable'}
      </Button>
    )}
  ];

  const roleColumns = [
    { title: 'Role Name', dataIndex: 'name' },
    { title: 'Type', dataIndex: 'isSystemRole', render: sys => (
      <Tag color={sys ? 'gold' : 'blue'}>{sys ? 'System' : 'Custom'}</Tag>
    )},
    { title: 'Permissions', dataIndex: 'permissions', render: perms => (
      <span>
        {(perms || []).slice(0, 3).map(p => <Tag key={p.id}>{p.name.split('_')[0]}</Tag>)}
        {(perms || []).length > 3 && <Tag>+{(perms || []).length - 3} more</Tag>}
      </span>
    )}
  ];

  // Group permissions by prefix (e.g. USER, ROLE, INVENTORY)
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const group = perm.name.split('_')[0] || 'OTHER';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  return (
    <div>
      <Title level={2}>Settings</Title>

      <Tabs defaultActiveKey="2">
        <TabPane tab={<span><SettingOutlined /> General</span>} key="2">
          <Card style={{ maxWidth: 600 }}>
            <Form 
              layout="vertical" 
              initialValues={generalSettings}
              onFinish={handleSaveGeneralSettings}
            >
              <Form.Item name="businessName" label="Business Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="currency" label="Base Currency">
                <Select>
                  <Option value="TZS">TZS - Tanzanian Shilling</Option>
                  <Option value="USD">USD - US Dollar</Option>
                </Select>
              </Form.Item>
              <Form.Item name="timezone" label="Timezone">
                <Select>
                  <Option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">Save Settings</Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab={<span><LockOutlined /> Security</span>} key="security">
          <Card style={{ maxWidth: 600 }} title="Change Password">
            <Form 
              layout="vertical" 
              onFinish={async (values) => {
                if (values.newPassword !== values.confirmPassword) {
                  message.error("New passwords do not match!");
                  return;
                }
                try {
                  const { changePassword } = await import('../services/identityApi');
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
        </TabPane>

        <TabPane tab={<span><UserOutlined /> User Management</span>} key="3">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" onClick={() => setIsModalVisible(true)}>
                + Create User
              </Button>
            </div>
            
            <Table 
              dataSource={users} 
              columns={columns} 
              rowKey="id" 
              loading={loading} 
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><LockOutlined /> Role Management</span>} key="4">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" onClick={() => setIsRoleModalVisible(true)}>
                + Create Role
              </Button>
            </div>
            
            <Table 
              dataSource={roles} 
              columns={roleColumns} 
              rowKey="id" 
              loading={loading} 
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="Create New User"
        open={isModalVisible}
        onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="roleId" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select a role">
              {roles.map(r => (
                <Option key={r.id} value={r.id}>{r.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create User</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create New Role"
        open={isRoleModalVisible}
        onCancel={() => { setIsRoleModalVisible(false); roleForm.resetFields(); }}
        footer={null}
        width={800}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleCreateRole}>
          <Form.Item name="name" label="Role Name" rules={[{ required: true }]}>
            <Input size="large" placeholder="e.g. Production Manager" />
          </Form.Item>
          
          <Form.Item name="permissionIds" label="Permissions" rules={[{ required: true, message: 'Select at least one permission' }]}>
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[24, 24]}>
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <Col xs={24} sm={12} md={8} key={group}>
                    <Text strong style={{ 
                      display: 'block', 
                      marginBottom: 12, 
                      color: 'var(--color-primary)', 
                      borderBottom: '1px solid #f0f0f0', 
                      paddingBottom: 4 
                    }}>
                      {group}
                    </Text>
                    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                      {perms.map(p => (
                        <Checkbox key={p.id} value={p.id}>
                          <Text style={{ fontSize: '13px' }}>{p.name.substring(group.length + 1)}</Text>
                        </Checkbox>
                      ))}
                    </Space>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button onClick={() => setIsRoleModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Create Role</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
