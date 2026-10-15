import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Modal, Form, Input, Space, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { fetchTenants, createTenant, updateTenant, toggleTenantStatus } from '../utils/identityApi';
import { withSorters } from '../utils/tableUtils';
import SearchableTable from '../components/SearchableTable';

const { Title } = Typography;

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const data = await fetchTenants();
      setTenants(data);
    } catch (e) {
      console.error(e);
      message.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTenant = async (values) => {
    try {
      await createTenant(values);
      message.success("Tenant created successfully!");
      setIsModalVisible(false);
      form.resetFields();
      loadTenants();
    } catch (error) {
      message.error(error.message || "Failed to save tenant");
    }
  };

  const handleToggleStatus = async (tenantId) => {
    try {
      await toggleTenantStatus(tenantId);
      message.success("Tenant status toggled successfully!");
      loadTenants();
    } catch (error) {
      message.error(error.message || "Failed to toggle status");
    }
  };

  const columns = [
    { title: 'Subdomain (Slug)', dataIndex: 'name' },
    { title: 'Display Name', dataIndex: 'displayName' },
    { title: 'Status', dataIndex: 'active', render: active => (
      <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Suspended'}</Tag>
    )},
    { title: 'Action', key: 'action', render: (_, record) => {
      const isAdminTenant = record.name === 'admin' || record.id === '00000000-0000-0000-0000-000000000000';
      return (
        <Space>
          <Button type="primary" onClick={() => navigate(`/tenants/${record.id}`)}>
            Manage
          </Button>
          <Button 
            type="link" 
            danger={!isAdminTenant && record.active} 
            disabled={isAdminTenant}
            title={isAdminTenant ? "System admin tenant cannot be suspended" : undefined}
            onClick={() => !isAdminTenant && handleToggleStatus(record.id)}
          >
            {record.active ? 'Suspend' : 'Activate'}
          </Button>
        </Space>
      );
    }}
  ];

  return (
    <div>
      <Title level={2}>Manage Tenants</Title>
      
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" onClick={() => { form.resetFields(); setIsModalVisible(true); }}>
            + Create Tenant
          </Button>
        </div>
        
        <SearchableTable 
          dataSource={tenants} 
          columns={withSorters(columns)} 
          rowKey="id" 
          loading={loading} 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal title="Create New Tenant" open={isModalVisible} onCancel={() => { setIsModalVisible(false); form.resetFields(); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSaveTenant}>
          <Form.Item name="name" label="Subdomain Slug" rules={[{ required: true }]} help="Lowercase, alphanumeric, and immutable. e.g. bakery1">
            <Input />
          </Form.Item>
          <Form.Item name="displayName" label="Business Display Name" rules={[{ required: true }]} help="e.g. SUNRISE ARTISAN BAKERY & CAFE">
            <Input />
          </Form.Item>
          
          <Title level={5} style={{ marginTop: 24 }}>Default Admin User</Title>
          <Form.Item name="adminName" label="Admin Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. System Admin" />
          </Form.Item>
          <Form.Item name="adminEmail" label="Admin Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="admin@business.com" />
          </Form.Item>
          <Form.Item name="adminPassword" label="Admin Password" rules={[{ required: true }]}>
            <Input.Password placeholder="Temporary password" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => { setIsModalVisible(false); }}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create Tenant</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
