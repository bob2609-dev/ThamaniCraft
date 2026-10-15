import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Typography, Card, Table, Button, Space, message, Tag, Modal, Form, Input, InputNumber, Switch, Tabs, Image, Select, Alert } from 'antd';
import { PlusOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { fetchPlans, createPlan, updatePlan, assignPlanToTenant, fetchPendingInvoices, approveInvoice, rejectInvoice } from '../utils/subscriptionApi';
import { fetchTenants } from '../utils/identityApi';
import { parseModules, formatModuleName, AVAILABLE_MODULES } from '../utils/moduleHelpers';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

export default function Subscriptions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'plans' ? 'plans' : 'verifications';

  const [plans, setPlans] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Plan Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form] = Form.useForm();

  // Assign Plan to Tenant Modal
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigningPlan, setAssigningPlan] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignForm] = Form.useForm();

  // Rejection Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingInvoice, setRejectingInvoice] = useState(null);
  const [rejectForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, invoicesData] = await Promise.all([
        fetchPlans().catch(() => []),
        fetchPendingInvoices().catch(() => [])
      ]);
      setPlans(plansData);
      setPendingInvoices(invoicesData);
    } catch (error) {
      console.error(error);
      message.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPlanModal = (plan = null) => {
    setEditingPlan(plan);
    if (plan) {
      form.setFieldsValue({
        ...plan,
        includedModules: parseModules(plan.includedModules),
        visibleToCustomers: plan.visibleToCustomers !== false,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ 
        active: true, 
        visibleToCustomers: true,
        monthlyPrice: 0, 
        maxUsers: 10, 
        includedModules: [] 
      });
    }
    setModalVisible(true);
  };

  const handleSavePlan = async (values) => {
    try {
      const payload = {
        ...values,
        includedModules: JSON.stringify(values.includedModules || []),
        visibleToCustomers: values.visibleToCustomers !== false,
      };
      if (editingPlan) {
        await updatePlan(editingPlan.id, payload);
        message.success("Plan updated successfully");
      } else {
        await createPlan(payload);
        message.success("Plan created successfully");
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      message.error(error.message || "Failed to save plan");
    }
  };

  const handleToggleVisibility = async (record, isVisible) => {
    try {
      const payload = {
        ...record,
        visibleToCustomers: isVisible,
        includedModules: typeof record.includedModules === 'string' && record.includedModules.startsWith('[')
          ? record.includedModules
          : JSON.stringify(parseModules(record.includedModules)),
      };
      await updatePlan(record.id, payload);
      message.success(`Plan "${record.name}" is now ${isVisible ? 'visible to customers' : 'hidden from customers'}`);
      loadData();
    } catch (error) {
      console.error(error);
      message.error("Failed to update visibility");
    }
  };

  const handleOpenAssignModal = async (plan) => {
    setAssigningPlan(plan);
    assignForm.resetFields();
    assignForm.setFieldsValue({ autoActivate: true });
    setAssignModalVisible(true);
    try {
      const tenantList = await fetchTenants().catch(() => []);
      setTenants(tenantList);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmAssign = async (values) => {
    setAssignLoading(true);
    try {
      await assignPlanToTenant(values.tenantId, assigningPlan.code, values.autoActivate !== false);
      const matched = tenants.find(t => t.id === values.tenantId);
      message.success(`Assigned ${assigningPlan.name} to ${matched?.displayName || 'tenant'} successfully!`);
      setAssignModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      message.error(error.message || "Failed to assign plan");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleApprove = async (invoiceId) => {
    try {
      await approveInvoice(invoiceId);
      message.success("Payment approved successfully. Subscription is now active.");
      loadData();
    } catch (error) {
      console.error(error);
      message.error(error.message || "Failed to approve payment");
    }
  };

  const handleOpenReject = (invoice) => {
    setRejectingInvoice(invoice);
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async (values) => {
    try {
      await rejectInvoice(rejectingInvoice.id, values.reason);
      message.success("Payment rejected.");
      setRejectModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      message.error(error.message || "Failed to reject payment");
    }
  };

  const planColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Monthly Price',
      dataIndex: 'monthlyPrice',
      key: 'monthlyPrice',
      render: (price) => `TZS ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      title: 'Max Users',
      dataIndex: 'maxUsers',
      key: 'maxUsers',
      render: (val) => val === -1 ? 'Unlimited' : val,
    },
    {
      title: 'Included Modules',
      dataIndex: 'includedModules',
      key: 'includedModules',
      render: (mods) => {
        const list = parseModules(mods);
        if (list.length === 0) return <Text type="secondary">None</Text>;
        return (
          <Space size={[2, 4]} wrap>
            {list.map(mod => (
              <Tag color="cyan" key={mod}>{formatModuleName(mod)}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Visible to Customers',
      dataIndex: 'visibleToCustomers',
      key: 'visibleToCustomers',
      render: (visible, record) => (
        <Switch 
          size="small"
          checked={visible !== false}
          checkedChildren="Visible"
          unCheckedChildren="Hidden"
          onChange={(checked) => handleToggleVisibility(record, checked)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleOpenPlanModal(record)}
          >
            Edit
          </Button>
          <Button 
            type="primary"
            ghost
            size="small"
            icon={<UserSwitchOutlined />} 
            onClick={() => handleOpenAssignModal(record)}
          >
            Assign
          </Button>
        </Space>
      ),
    },
  ];

  const invoiceColumns = [
    {
      title: 'Tenant ID',
      dataIndex: 'tenantId',
      key: 'tenantId',
      render: (id) => <Text copyable style={{ width: 100 }} ellipsis>{id}</Text>
    },
    {
      title: 'Plan',
      dataIndex: 'planCode',
      key: 'planCode',
      render: (text) => <Tag>{text}</Tag>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (price) => `TZS ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      title: 'Reference No.',
      dataIndex: 'paymentReference',
      key: 'paymentReference',
      render: (ref) => <strong>{ref || 'N/A'}</strong>
    },
    {
      title: 'Proof',
      key: 'proof',
      render: (_, record) => (
        record.proofUrl ? (
          <Image
            width={50}
            src={record.proofUrl}
            alt="Receipt"
          />
        ) : <Text type="secondary">No Image</Text>
      )
    },
    {
      title: 'Date Submitted',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            style={{ backgroundColor: '#52c41a' }} 
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove(record.id)}
          >
            Approve
          </Button>
          <Button 
            danger 
            icon={<CloseCircleOutlined />}
            onClick={() => handleOpenReject(record)}
          >
            Reject
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Subscriptions & Billing</Title>
        <Paragraph type="secondary" style={{ margin: 0 }}>Manage SaaS subscription plans, customer visibility, and verify payments.</Paragraph>
      </div>

      <Card>
        <Tabs 
          activeKey={currentTab} 
          onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
        >
          <TabPane tab={`Pending Verifications (${pendingInvoices.length})`} key="verifications">
            <Table
              dataSource={pendingInvoices}
              columns={invoiceColumns}
              rowKey="id"
              loading={loading}
              pagination={true}
            />
          </TabPane>
          <TabPane tab="Subscription Plans" key="plans">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenPlanModal()}>
                Add Plan
              </Button>
            </div>
            <Table
              dataSource={plans}
              columns={planColumns}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Create / Edit Plan Modal */}
      <Modal
        title={editingPlan ? "Edit Subscription Plan" : "Create New Plan"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSavePlan}>
          <Form.Item name="code" label="Plan Code" rules={[{ required: true }]} help="e.g. FREE, PRO, ENTERPRISE, CUSTOM_A (unique identifier)">
            <Input disabled={!!editingPlan} />
          </Form.Item>
          <Form.Item name="name" label="Display Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="monthlyPrice" label="Monthly Price (TZS)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="maxUsers" label="Max Users (-1 for unlimited)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={-1} />
          </Form.Item>
          <Form.Item name="includedModules" label="Included Modules" help="Select the modules enabled for this subscription plan">
            <Select 
              mode="multiple" 
              placeholder="Select included modules" 
              options={AVAILABLE_MODULES}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="active" label="Status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
            
            <Form.Item 
              name="visibleToCustomers" 
              label="Visible to Customers" 
              valuePropName="checked"
              help="Whether visible on tenant billing portal"
            >
              <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
            </Form.Item>
          </div>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 12 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Save Plan</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Plan to Tenant Modal */}
      <Modal
        title={assigningPlan ? `Assign "${assigningPlan.name}" to Tenant` : "Assign Plan to Tenant"}
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        width={500}
      >
        {assigningPlan && (
          <Form form={assignForm} layout="vertical" onFinish={handleConfirmAssign}>
            <Alert
              message={
                <Space direction="vertical" size={2}>
                  <div><strong>Plan Code:</strong> <Tag color="blue">{assigningPlan.code}</Tag> | <strong>Price:</strong> TZS {Number(assigningPlan.monthlyPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo</div>
                  <div><strong>Modules:</strong> {parseModules(assigningPlan.includedModules).map(m => formatModuleName(m)).join(', ') || 'None'}</div>
                  {assigningPlan.visibleToCustomers === false && (
                    <Text type="warning" style={{ fontSize: 12 }}>Note: This plan is hidden from self-service customers.</Text>
                  )}
                </Space>
              }
              type="info"
              style={{ marginBottom: 20 }}
            />

            <Form.Item 
              name="tenantId" 
              label="Target Tenant" 
              rules={[{ required: true, message: 'Please select a tenant' }]}
            >
              <Select 
                showSearch 
                placeholder="Search and select tenant..." 
                optionFilterProp="children"
                style={{ width: '100%' }}
              >
                {tenants.map(t => (
                  <Option key={t.id} value={t.id}>
                    {t.displayName} ({t.name})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item 
              name="autoActivate" 
              label="Immediate Activation" 
              valuePropName="checked"
              initialValue={true}
              help="If enabled, the subscription is activated immediately and marked as settled. Otherwise, an unpaid invoice is created."
            >
              <Switch checkedChildren="Activate Immediately" unCheckedChildren="Create Unpaid Invoice" defaultChecked />
            </Form.Item>

            <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
              <Space>
                <Button onClick={() => setAssignModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={assignLoading}>
                  Assign Plan to Tenant
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Reject Payment Modal */}
      <Modal
        title="Reject Payment"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleConfirmReject}>
          <Form.Item 
            name="reason" 
            label="Reason for Rejection" 
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <Input.TextArea rows={4} placeholder="e.g. Invalid reference number, receipt image illegible, etc." />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setRejectModalVisible(false)}>Cancel</Button>
              <Button danger type="primary" htmlType="submit">Confirm Rejection</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
