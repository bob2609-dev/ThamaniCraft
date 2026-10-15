import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Button, 
  Table, 
  Space, 
  Progress, 
  Spin, 
  Modal, 
  Form, 
  Input, 
  message, 
  theme as antdTheme 
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  CreditCard, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Server, 
  Plus, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldCheck, 
  Settings, 
  FileText 
} from 'lucide-react';
import { fetchAdminDashboardStats, createTenant } from '../utils/identityApi';

const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTenantModalVisible, setIsTenantModalVisible] = useState(false);
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const {
    token: { colorBgContainer, colorBorderSecondary, colorPrimary },
  } = antdTheme.useToken();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      message.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleCreateTenant = async (values) => {
    setCreatingTenant(true);
    try {
      await createTenant(values);
      message.success('Tenant onboarded successfully!');
      setIsTenantModalVisible(false);
      form.resetFields();
      loadDashboardData();
    } catch (error) {
      message.error(error.message || 'Failed to create tenant');
    } finally {
      setCreatingTenant(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0.00';
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Loading platform metrics..." />
      </div>
    );
  }

  const tenantColumns = [
    {
      title: 'Business Display Name',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>ID: {record.id}</Text>
        </div>
      ),
    },
    {
      title: 'Subdomain',
      dataIndex: 'name',
      key: 'name',
      render: (slug) => (
        <Tag style={{ fontFamily: 'monospace' }}>{slug}</Tag>
      ),
    },
    {
      title: 'Subscription',
      dataIndex: 'planCode',
      key: 'planCode',
      render: (code, record) => {
        let color = 'default';
        if (code === 'PRO') color = 'gold';
        else if (code === 'ENTERPRISE') color = 'purple';
        else if (code === 'FREE') color = 'blue';
        return <Tag color={color}>{record.planName || code}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Suspended'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          onClick={() => navigate(`/tenants/${record.id}`)}
        >
          Manage
        </Button>
      ),
    },
  ];

  const totalSubsCount = stats?.activeSubscriptions || 1;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Platform Dashboard</Title>
          <Text type="secondary">Global real-time overview of ThamaniCraft tenants, subscriptions, and system health.</Text>
        </div>
        <Space>
          <Button 
            icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} 
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<Plus size={16} />} 
            style={{ backgroundColor: '#D97706' }}
            onClick={() => setIsTenantModalVisible(true)}
          >
            New Tenant
          </Button>
        </Space>
      </div>

      {/* KPI Cards Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Total Tenants */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ borderRadius: 12, border: `1px solid ${colorBorderSecondary}` }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 600 }}>Total Tenants</Text>
                <Title level={2} style={{ margin: '8px 0 4px', fontWeight: 700 }}>
                  {stats?.totalTenants ?? 0}
                </Title>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} color="#D97706" />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Space size={6}>
                <Tag color="green">{stats?.activeTenants ?? 0} Active</Tag>
                <Tag color="red">{stats?.suspendedTenants ?? 0} Suspended</Tag>
              </Space>
            </div>
          </Card>
        </Col>

        {/* Monthly Recurring Revenue */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ borderRadius: 12, border: `1px solid ${colorBorderSecondary}` }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 600 }}>Monthly Revenue (MRR)</Text>
                <Title level={3} style={{ margin: '8px 0 4px', color: '#10B981', fontWeight: 700 }}>
                  TZS {formatCurrency(stats?.mrr)}
                </Title>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={24} color="#10B981" />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Annualized Run Rate: <strong>TZS {formatCurrency(Number(stats?.mrr || 0) * 12)}</strong>
              </Text>
            </div>
          </Card>
        </Col>

        {/* Active Subscriptions */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ borderRadius: 12, border: `1px solid ${colorBorderSecondary}` }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 600 }}>Active Licenses</Text>
                <Title level={2} style={{ margin: '8px 0 4px', fontWeight: 700 }}>
                  {stats?.activeSubscriptions ?? 0}
                </Title>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={24} color="#3B82F6" />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Across configured subscription tiers
              </Text>
            </div>
          </Card>
        </Col>

        {/* Pending Invoices */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ borderRadius: 12, border: `1px solid ${colorBorderSecondary}` }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 600 }}>Pending Invoices</Text>
                <Title level={2} style={{ margin: '8px 0 4px', fontWeight: 700, color: (stats?.pendingInvoicesCount || 0) > 0 ? '#F59E0B' : undefined }}>
                  {stats?.pendingInvoicesCount ?? 0}
                </Title>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={24} color="#F59E0B" />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              {(stats?.pendingInvoicesCount || 0) > 0 ? (
                <Tag 
                  color="warning" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/subscriptions?tab=verifications')}
                >
                  Requires Verification →
                </Tag>
              ) : (
                <Tag color="success">All Invoices Cleared</Tag>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Middle Section: Plan Distribution & System Health */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Subscription Plan Distribution */}
        <Col xs={24} lg={14}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="#D97706" />
                <span>Subscription Plan Distribution</span>
              </div>
            }
            extra={<Button type="link" onClick={() => navigate('/subscriptions?tab=plans')}>Manage Plans</Button>}
            style={{ borderRadius: 12, height: '100%', border: `1px solid ${colorBorderSecondary}` }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(stats?.planDistribution || []).map((plan) => {
                const percentage = stats?.activeSubscriptions > 0 
                  ? Math.round((plan.count / stats.activeSubscriptions) * 100) 
                  : 0;
                return (
                  <div key={plan.code}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div>
                        <Text strong>{plan.name}</Text>
                        <Tag color="blue" style={{ marginLeft: 8 }}>{plan.code}</Tag>
                      </div>
                      <div>
                        <Text strong>{plan.count} tenants</Text>
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                          ({percentage}%) · TZS {formatCurrency(plan.monthlyPrice)}/mo
                        </Text>
                      </div>
                    </div>
                    <Progress 
                      percent={percentage} 
                      strokeColor="#D97706" 
                      showInfo={false} 
                      size="small" 
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Platform Services Health */}
        <Col xs={24} lg={10}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Server size={18} color="#10B981" />
                <span>System Microservices Health</span>
              </div>
            }
            extra={
              stats?.systemHealth?.status === 'UP' ? (
                <Tag color="success" icon={<CheckCircle2 size={12} className="inline mr-1" />}>
                  ALL OPERATIONAL
                </Tag>
              ) : (
                <Tag color="error">
                  DEGRADED
                </Tag>
              )
            }
            style={{ borderRadius: 12, height: '100%', border: `1px solid ${colorBorderSecondary}` }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {stats?.systemHealth?.services && Object.entries(stats.systemHealth.services).map(([serviceName, info]) => {
                const isUp = info.status === 'UP';
                return (
                  <div 
                    key={serviceName}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${isUp ? colorBorderSecondary : 'rgba(239, 68, 68, 0.4)'}`,
                      backgroundColor: isUp ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isUp ? '#10B981' : '#EF4444' }} />
                      <Space size={4}>
                        {info.latencyMs !== undefined && (
                          <span style={{ fontSize: 10, color: '#888' }}>{info.latencyMs}ms</span>
                        )}
                        <Tag color={isUp ? 'green' : 'red'} style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>
                          {info.status || 'UNKNOWN'}
                        </Tag>
                      </Space>
                    </div>
                    <Text strong style={{ fontSize: 12, wordBreak: 'break-word' }}>
                      {serviceName}
                    </Text>
                    {info.port && (
                      <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>
                        Port: {info.port}
                      </Text>
                    )}
                    {info.error && (
                      <Text type="danger" style={{ fontSize: 10, marginTop: 2 }}>
                        {info.error}
                      </Text>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom Section: Recent Tenants & Quick Actions */}
      <Row gutter={[16, 16]}>
        {/* Recent Tenants Table */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} color="#D97706" />
                <span>Recent Tenants</span>
              </div>
            }
            extra={<Button type="link" onClick={() => navigate('/tenants')}>View All Tenants</Button>}
            style={{ borderRadius: 12, border: `1px solid ${colorBorderSecondary}` }}
          >
            <Table 
              dataSource={stats?.recentTenants || []}
              columns={tenantColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>

        {/* Quick Admin Actions */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} color="#D97706" />
                <span>Admin Quick Actions</span>
              </div>
            }
            style={{ borderRadius: 12, border: `1px solid ${colorBorderSecondary}` }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button 
                block 
                style={{ textAlign: 'left', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setIsTenantModalVisible(true)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={16} color="#D97706" />
                  <span>Onboard New Tenant</span>
                </span>
                <ArrowUpRight size={14} color="#888" />
              </Button>

              <Button 
                block 
                style={{ textAlign: 'left', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => navigate('/subscriptions?tab=plans')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={16} color="#3B82F6" />
                  <span>Manage Subscription Plans</span>
                </span>
                <ArrowUpRight size={14} color="#888" />
              </Button>

              <Button 
                block 
                style={{ textAlign: 'left', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => navigate('/subscriptions?tab=verifications')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={16} color="#10B981" />
                  <span>Verify Tenant Invoices</span>
                </span>
                <ArrowUpRight size={14} color="#888" />
              </Button>

              <Button 
                block 
                style={{ textAlign: 'left', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => navigate('/logs?tab=audit')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color="#8B5CF6" />
                  <span>View System Audit Logs</span>
                </span>
                <ArrowUpRight size={14} color="#888" />
              </Button>

              <Button 
                block 
                style={{ textAlign: 'left', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => navigate('/settings?tab=roles')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color="#64748B" />
                  <span>RBAC & Security Policies</span>
                </span>
                <ArrowUpRight size={14} color="#888" />
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Modal: Create New Tenant */}
      <Modal 
        title="Onboard New Tenant" 
        open={isTenantModalVisible} 
        onCancel={() => { setIsTenantModalVisible(false); form.resetFields(); }} 
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTenant}>
          <Form.Item 
            name="name" 
            label="Subdomain Slug" 
            rules={[{ required: true, message: 'Please enter subdomain slug' }]} 
            help="Lowercase, alphanumeric, and immutable. e.g. artisanbakes"
          >
            <Input placeholder="e.g. bakery1" />
          </Form.Item>
          <Form.Item 
            name="displayName" 
            label="Business Display Name" 
            rules={[{ required: true, message: 'Please enter business display name' }]} 
            help="e.g. SUNRISE ARTISAN BAKERY & CAFE"
          >
            <Input placeholder="e.g. Artisan Bakes Co." />
          </Form.Item>
          
          <Title level={5} style={{ marginTop: 20 }}>Default Admin User</Title>
          <Form.Item 
            name="adminName" 
            label="Admin Name" 
            rules={[{ required: true, message: 'Please enter admin name' }]}
          >
            <Input placeholder="e.g. Alice Mrema" />
          </Form.Item>
          <Form.Item 
            name="adminEmail" 
            label="Admin Email" 
            rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}
          >
            <Input placeholder="alice@artisanbakes.com" />
          </Form.Item>
          <Form.Item 
            name="adminPassword" 
            label="Admin Password" 
            rules={[{ required: true, message: 'Please set initial admin password' }]}
          >
            <Input.Password placeholder="Initial password" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsTenantModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={creatingTenant} style={{ backgroundColor: '#D97706' }}>
                Create Tenant
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
