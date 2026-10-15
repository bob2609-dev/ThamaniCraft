import React, { useState, useEffect } from 'react';
import { Typography, Card, Form, Input, Button, Space, message, Tabs, Spin, Tag, Breadcrumb, Popconfirm } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTenantById, updateTenant, toggleTenantStatus } from '../utils/identityApi';
import SubscriptionTab from '../components/tenants/SubscriptionTab';
import ModulesTab from '../components/tenants/ModulesTab';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function TenantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  const isAdminTenant = tenant?.name === 'admin' || tenant?.id === '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    loadTenant();
  }, [id]);

  const loadTenant = async () => {
    setLoading(true);
    try {
      const data = await fetchTenantById(id);
      setTenant(data);
      form.setFieldsValue({
        name: data.name,
        displayName: data.displayName,
        adminName: data.adminName,
        adminEmail: data.adminEmail,
      });
    } catch (e) {
      console.error(e);
      message.error("Failed to load tenant details");
      navigate('/tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTenant = async (values) => {
    try {
      await updateTenant(id, values);
      message.success("Tenant updated successfully!");
      loadTenant();
    } catch (error) {
      message.error(error.message || "Failed to update tenant");
    }
  };

  const handleToggleStatus = async () => {
    if (isAdminTenant) {
      message.warning("System admin tenant cannot be suspended");
      return;
    }
    try {
      await toggleTenantStatus(id);
      message.success("Tenant status toggled successfully!");
      loadTenant();
    } catch (error) {
      message.error(error.message || "Failed to toggle status");
    }
  };

  if (loading && !tenant) {
    return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/tenants')}>Tenants</a></Breadcrumb.Item>
        <Breadcrumb.Item>{tenant?.displayName || 'Details'}</Breadcrumb.Item>
      </Breadcrumb>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>{tenant?.displayName}</Title>
          <Text type="secondary">Subdomain: {tenant?.name}</Text>
          <Tag color={tenant?.active ? 'green' : 'red'} style={{ marginLeft: 12 }}>
            {tenant?.active ? 'Active' : 'Suspended'}
          </Tag>
          {isAdminTenant && (
            <Tag color="purple" style={{ marginLeft: 6 }}>
              System Admin Tenant
            </Tag>
          )}
        </div>
        <Popconfirm 
          title={`Are you sure you want to ${tenant?.active ? 'suspend' : 'activate'} this tenant?`} 
          onConfirm={handleToggleStatus}
          disabled={isAdminTenant}
        >
          <Button 
            danger={!isAdminTenant && tenant?.active} 
            disabled={isAdminTenant}
            title={isAdminTenant ? "System admin tenant cannot be suspended" : undefined}
          >
            {tenant?.active ? 'Suspend Tenant' : 'Activate Tenant'}
          </Button>
        </Popconfirm>
      </div>

      <Tabs defaultActiveKey="general">
        <TabPane tab="General Info" key="general">
          <Card style={{ maxWidth: 800 }}>
            <Form form={form} layout="vertical" onFinish={handleSaveTenant}>
              <Title level={5}>Tenant Profile</Title>
              <Form.Item name="name" label="Subdomain Slug" rules={[{ required: true }]} help="Lowercase, alphanumeric, and immutable. e.g. bakery1">
                <Input disabled />
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
              <Form.Item name="adminPassword" label="Admin Password" help="Leave blank to keep current password">
                <Input.Password placeholder="New password (optional)" />
              </Form.Item>

              <Form.Item style={{ textAlign: 'right', marginTop: 24, marginBottom: 0 }}>
                <Button type="primary" htmlType="submit">Save Changes</Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        <TabPane tab="Subscriptions" key="subscriptions">
          <SubscriptionTab tenantId={id} />
        </TabPane>
        <TabPane tab="Modules" key="modules">
          <ModulesTab tenantId={id} />
        </TabPane>
      </Tabs>
    </div>
  );
}
