import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, message, Descriptions, Tag, Button, Select, Form, Modal, Table, Space, Image, Popconfirm, Input, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { 
  fetchTenantSubscription, 
  assignPlanToTenant, 
  fetchPlans, 
  fetchTenantInvoices, 
  approveInvoice, 
  rejectInvoice 
} from '../../utils/subscriptionApi';
import { parseModules, formatModuleName } from '../../utils/moduleHelpers';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function SubscriptionTab({ tenantId }) {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Plan Change Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Review / Inspection Modal
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingInvoiceId, setRejectingInvoiceId] = useState(null);
  const [rejectForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subData, plansData, invoicesData] = await Promise.all([
        fetchTenantSubscription(tenantId).catch(() => null),
        fetchPlans().catch(() => []),
        fetchTenantInvoices(tenantId).catch(() => [])
      ]);
      setSubscription(subData);
      setPlans(plansData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error(error);
      message.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = async (values) => {
    try {
      await assignPlanToTenant(tenantId, values.planCode);
      message.success("Plan assigned successfully");
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error("Failed to assign plan");
    }
  };

  const handleApprove = async (invoiceId) => {
    try {
      await approveInvoice(invoiceId);
      message.success("Payment approved successfully. Subscription activated.");
      if (reviewModalVisible) setReviewModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      message.error(error.message || "Failed to approve payment");
    }
  };

  const handleOpenReject = (invoiceId) => {
    setRejectingInvoiceId(invoiceId);
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async (values) => {
    try {
      await rejectInvoice(rejectingInvoiceId, values.reason || "Payment details could not be verified");
      message.success("Payment rejected.");
      setRejectModalVisible(false);
      if (reviewModalVisible) setReviewModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      message.error(error.message || "Failed to reject payment");
    }
  };

  const openReviewModal = (invoice) => {
    setSelectedInvoice(invoice);
    setReviewModalVisible(true);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'PAID':
        return <Tag color="green">PAID</Tag>;
      case 'PENDING_VERIFICATION':
        return <Tag color="orange">PENDING VERIFICATION</Tag>;
      case 'UNPAID':
        return <Tag color="red">UNPAID</Tag>;
      case 'CANCELLED':
        return <Tag color="default">CANCELLED</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const invoiceColumns = [
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => (date ? new Date(date).toLocaleDateString() : '—')
    },
    {
      title: 'Plan',
      dataIndex: 'planCode',
      key: 'planCode',
      width: 120,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Billing Period',
      key: 'period',
      width: 190,
      render: (_, record) => {
        const start = record.billingPeriodStart ? new Date(record.billingPeriodStart).toLocaleDateString() : '';
        const end = record.billingPeriodEnd ? new Date(record.billingPeriodEnd).toLocaleDateString() : '';
        return start && end ? `${start} – ${end}` : '—';
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
          TZS {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Ref Number',
      dataIndex: 'paymentReference',
      key: 'paymentReference',
      width: 150,
      render: (ref) => ref ? <Text copyable strong>{ref}</Text> : <Text type="secondary">—</Text>
    },
    {
      title: 'Proof',
      dataIndex: 'proofUrl',
      key: 'proofUrl',
      width: 80,
      render: (url) => url ? (
        <Image 
          src={url} 
          width={36} 
          height={36} 
          style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }} 
        />
      ) : <Text type="secondary">—</Text>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'PENDING_VERIFICATION' && (
            <>
              <Button 
                size="small" 
                type="primary" 
                icon={<EyeOutlined />}
                onClick={() => openReviewModal(record)}
              >
                Review
              </Button>
              <Popconfirm
                title="Approve this payment?"
                description="This will mark the invoice as PAID and activate the subscription."
                onConfirm={() => handleApprove(record.id)}
                okText="Yes, Approve"
                cancelText="Cancel"
              >
                <Button size="small" style={{ color: '#52c41a', borderColor: '#52c41a' }} icon={<CheckCircleOutlined />}>
                  Approve
                </Button>
              </Popconfirm>
            </>
          )}

          {record.status === 'UNPAID' && (
            <Popconfirm
              title="Mark invoice as PAID?"
              description="Manually approve offline payment and activate subscription?"
              onConfirm={() => handleApprove(record.id)}
              okText="Mark Paid"
              cancelText="Cancel"
            >
              <Button size="small" type="primary" ghost icon={<CheckCircleOutlined />}>
                Mark Paid
              </Button>
            </Popconfirm>
          )}

          {record.status === 'PAID' && (
            <Tag color="green" icon={<CheckCircleOutlined />}>Settled</Tag>
          )}
        </Space>
      )
    }
  ];

  if (loading) {
    return <Spin />;
  }

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>Current Subscription</Title>
            <Text type="secondary">Plan entitlement and active billing schedule</Text>
          </div>
          <Button type="primary" onClick={() => setModalVisible(true)}>Change Plan</Button>
        </div>

        {subscription ? (
          <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Plan Name">
              <strong>{subscription.plan.name}</strong> <Tag color="blue">{subscription.plan.code}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={subscription.status === 'ACTIVE' ? 'green' : 'orange'}>{subscription.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Monthly Price">
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                TZS {Number(subscription.plan.monthlyPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Start Date">
              {subscription.startDate}
            </Descriptions.Item>
            <Descriptions.Item label="Next Billing Date">
              {subscription.nextBillingDate}
            </Descriptions.Item>
            <Descriptions.Item label="Included Modules">
              {(() => {
                const list = parseModules(subscription.plan.includedModules);
                if (list.length === 0) return <Text type="secondary">All Base Modules</Text>;
                return (
                  <Space size={[4, 4]} wrap>
                    {list.map(mod => (
                      <Tag color="blue" key={mod}>{formatModuleName(mod)}</Tag>
                    ))}
                  </Space>
                );
              })()}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Text type="secondary">No active subscription found for this tenant.</Text>
        )}
      </Card>

      <Card title="Payment & Invoice History" extra={<Text type="secondary">{invoices.length} total invoice(s)</Text>}>
        <Table
          columns={invoiceColumns}
          dataSource={invoices}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="middle"
          locale={{ emptyText: 'No invoices found for this tenant.' }}
        />
      </Card>

      {/* Change Subscription Plan Modal */}
      <Modal
        title="Change Subscription Plan"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAssignPlan}>
          <Form.Item name="planCode" label="Select Plan" rules={[{ required: true }]}>
            <Select placeholder="Choose a new plan">
              {plans.map(p => (
                <Option key={p.code} value={p.code}>
                  {p.name} - TZS {Number(p.monthlyPrice).toLocaleString()}/mo
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Assign Plan</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Review / Verify Invoice Modal */}
      <Modal
        title="Verify Payment Details"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={550}
      >
        {selectedInvoice && (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Plan Code">
                <Tag color="blue">{selectedInvoice.planCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                  TZS {Number(selectedInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Reference">
                <Text copyable strong>{selectedInvoice.paymentReference || 'N/A'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedInvoice.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : '—'}
              </Descriptions.Item>
            </Descriptions>

            {selectedInvoice.proofUrl ? (
              <div style={{ textAlign: 'center', marginBottom: 24, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Uploaded Receipt Proof:</Text>
                <Image 
                  src={selectedInvoice.proofUrl} 
                  alt="Proof of Payment" 
                  style={{ maxHeight: 250, objectFit: 'contain' }}
                />
              </div>
            ) : (
              <Paragraph type="secondary" style={{ textAlign: 'center', margin: '16px 0' }}>
                No receipt image uploaded. Verification relies on the reference code above.
              </Paragraph>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setReviewModalVisible(false)}>
                Close
              </Button>
              <Button 
                danger 
                icon={<CloseCircleOutlined />} 
                onClick={() => handleOpenReject(selectedInvoice.id)}
              >
                Reject Payment
              </Button>
              <Button 
                type="primary" 
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} 
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(selectedInvoice.id)}
              >
                Approve Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        title="Reject Payment"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
        width={450}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleConfirmReject}>
          <Form.Item 
            name="reason" 
            label="Reason for Rejection" 
            rules={[{ required: true, message: 'Please provide a reason for rejecting the payment' }]}
          >
            <TextArea rows={3} placeholder="e.g. Reference code not found in bank statement, amount mismatch..." />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setRejectModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" danger htmlType="submit">Confirm Rejection</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
