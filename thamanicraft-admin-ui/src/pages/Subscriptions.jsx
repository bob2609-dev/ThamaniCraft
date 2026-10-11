import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Button, Space, message, Tag, Modal, Form, Input, InputNumber, Switch, Tabs, Image, Select } from 'antd';
import { PlusOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { fetchPlans, createPlan, updatePlan, fetchPendingInvoices, approveInvoice, rejectInvoice } from '../utils/subscriptionApi';
import { parseModules, formatModuleName, AVAILABLE_MODULES } from '../utils/moduleHelpers';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

export default function Subscriptions() {
  const [plans, setPlans] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Plan Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form] = Form.useForm();

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
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ active: true, monthlyPrice: 0, maxUsers: 10, includedModules: [] });
    }
    setModalVisible(true);
  };

  const handleSavePlan = async (values) => {
    try {
      const payload = {
        ...values,
        includedModules: JSON.stringify(values.includedModules || []),
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
      render: (price) => `TZS ${Number(price).toFixed(2)}`,
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<EditOutlined />} 
          onClick={() => handleOpenPlanModal(record)}
        >
          Edit
        </Button>
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
      render: (price) => `TZS ${Number(price).toFixed(2)}`,
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
        <Paragraph type="secondary" style={{ margin: 0 }}>Manage SaaS subscription plans and verify payments.</Paragraph>
      </div>

      <Card>
        <Tabs defaultActiveKey="verifications">
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

      <Modal
        title={editingPlan ? "Edit Subscription Plan" : "Create New Plan"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSavePlan}>
          <Form.Item name="code" label="Plan Code" rules={[{ required: true }]} help="e.g. FREE, PRO, ENTERPRISE (immutable ideally)">
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
          <Form.Item name="active" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Save Plan</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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
