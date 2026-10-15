import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, message, Row, Col, Tag, Button, Alert, Divider, Table, Modal, Form, Input, Upload, Space, theme } from 'antd';
import { CheckCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { fetchMySubscription, fetchPlans, assignPlan, fetchInvoices, submitProofOfPayment } from '../services/subscriptionApi';
import { parseModules, formatModuleName } from '../utils/moduleHelpers';

const { Title, Text, Paragraph } = Typography;

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '0.00';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function Billing() {
  const { token } = theme.useToken();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subData, plansData, invoicesData] = await Promise.all([
        fetchMySubscription().catch(() => null),
        fetchPlans().catch(() => []),
        fetchInvoices().catch(() => [])
      ]);
      setSubscription(subData);
      setPlans(plansData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error(error);
      message.error("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planCode) => {
    try {
      setLoading(true);
      await assignPlan(planCode);
      message.success("Successfully subscribed to " + planCode);
      await loadData();
    } catch (error) {
      message.error(error.message || "Failed to subscribe");
      setLoading(false);
    }
  };

  const showPayModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalVisible(true);
    setFileList([]);
    form.resetFields();
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setSelectedInvoice(null);
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleSubmitProof = async (values) => {
    if (fileList.length === 0 && !values.reference) {
      message.error("Please provide either a reference number or upload a receipt");
      return;
    }

    try {
      setUploading(true);
      let base64 = null;
      if (fileList.length > 0) {
        base64 = await getBase64(fileList[0].originFileObj);
      }

      await submitProofOfPayment(selectedInvoice.id, values.reference || '', base64);
      message.success("Proof of payment submitted successfully");
      setIsModalVisible(false);
      await loadData();
    } catch (error) {
      console.error(error);
      message.error("Failed to submit proof of payment");
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: 'Plan',
      dataIndex: 'planCode',
      key: 'planCode',
    },
    {
      title: 'Amount (TZS)',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => formatCurrency(val)
    },
    {
      title: 'Billing Period',
      key: 'period',
      render: (_, record) => {
        const start = new Date(record.billingPeriodStart).toLocaleDateString();
        const end = new Date(record.billingPeriodEnd).toLocaleDateString();
        return `${start} - ${end}`;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'PAID') color = 'green';
        if (status === 'UNPAID') color = 'red';
        if (status === 'PENDING_VERIFICATION') color = 'orange';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        record.status === 'UNPAID' ? (
          <Button type="primary" size="small" onClick={() => showPayModal(record)}>
            Pay Now
          </Button>
        ) : null
      )
    }
  ];

  if (loading && !plans.length) {
    return <Spin />;
  }

  const activePlanCode = subscription?.plan?.code;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Billing & Subscriptions</Title>
        <Text type="secondary">Manage your current plan and billing cycles.</Text>
      </div>

      {subscription && (
        <Card style={{ marginBottom: 24 }} bordered={false} className="shadow-sm">
          <Title level={4}>Current Plan: <Tag color="blue" style={{ marginLeft: 8 }}>{subscription.plan.name}</Tag></Title>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Text type="secondary">Status</Text>
              <br/>
              <Tag color={subscription.status === 'ACTIVE' ? 'green' : 'orange'}>{subscription.status}</Tag>
            </Col>
            <Col span={6}>
              <Text type="secondary">Billing Cycle</Text>
              <br/>
              <Text strong>TZS {formatCurrency(subscription.plan.monthlyPrice)} / month</Text>
            </Col>
            <Col span={6}>
              <Text type="secondary">Current Period Ends</Text>
              <br/>
              <Text strong>{subscription.nextBillingDate}</Text>
            </Col>
            <Col span={6}>
              <Text type="secondary">Included Modules</Text>
              <br/>
              {(() => {
                const mods = parseModules(subscription.plan.includedModules);
                if (mods.length === 0) return <Text strong>All Base Modules</Text>;
                return (
                  <div style={{ marginTop: 4 }}>
                    <Space size={[4, 4]} wrap>
                      {mods.map(mod => (
                        <Tag color="blue" key={mod}>{formatModuleName(mod)}</Tag>
                      ))}
                    </Space>
                  </div>
                );
              })()}
            </Col>
          </Row>
        </Card>
      )}

      <Card title="Invoice History" style={{ marginBottom: 24 }} bordered={false} className="shadow-sm">
        <Table 
          dataSource={invoices} 
          columns={columns} 
          rowKey="id" 
          pagination={false} 
          loading={loading && invoices.length === 0}
        />
      </Card>

      <Title level={3} style={{ marginTop: 24 }}>Available Plans</Title>
      <Row gutter={[24, 24]} style={{ display: 'flex', alignItems: 'stretch' }}>
        {plans.filter(p => p.visibleToCustomers !== false && p.active !== false).map(plan => {
          const isActive = plan.code === activePlanCode;
          return (
            <Col xs={24} md={8} key={plan.id} style={{ display: 'flex' }}>
              <Card 
                hoverable 
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: isActive ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorBorderSecondary}` 
                }}
                styles={{
                  body: {
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }
                }}
                bodyStyle={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}
              >
                {isActive && <div style={{ position: 'absolute', top: 12, right: 12 }}><Tag color="blue">Current Plan</Tag></div>}
                <Title level={4}>{plan.name}</Title>
                <Title level={2} style={{ marginTop: 0, color: token.colorPrimary }}>
                  TZS {formatCurrency(plan.monthlyPrice)}<span style={{ fontSize: '14px', color: '#888' }}>/mo</span>
                </Title>
                <Paragraph type="secondary" style={{ minHeight: '44px', marginBottom: 16 }}>{plan.description}</Paragraph>
                
                <Divider style={{ margin: '16px 0' }} />
                
                <div style={{ flex: 1, marginBottom: 24 }}>
                  <div style={{ marginBottom: 12 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    <Text>Up to {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers} Users</Text>
                  </div>
                  {parseModules(plan.includedModules).map(mod => (
                    <div key={mod} style={{ marginBottom: 12 }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      <Text>{formatModuleName(mod)}</Text>
                    </div>
                  ))}
                  <div style={{ marginBottom: 12 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    <Text>24/7 Standard Support</Text>
                  </div>
                </div>

                <Button 
                  type={isActive ? "default" : "primary"}
                  disabled={isActive}
                  block 
                  size="large"
                  style={{ marginTop: 'auto' }}
                  onClick={() => handleSubscribe(plan.code)}
                  loading={loading && !isActive}
                >
                  {isActive ? 'Current Plan' : 'Upgrade to ' + plan.name}
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal
        title="Submit Payment Proof"
        open={isModalVisible}
        onCancel={handleCancelModal}
        footer={null}
      >
        <Alert
          message="Payment Instructions"
          description={
            <div>
              Please pay <b>TZS {formatCurrency(selectedInvoice?.amount)}</b> via mobile money or bank transfer to:
              <br/><br/>
              <b>M-Pesa:</b> +255 123 456 789<br/>
              <b>Bank:</b> CRDB, Account 01J2345678900
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical" onFinish={handleSubmitProof}>
          <Form.Item name="reference" label="Reference Number (e.g. from M-Pesa)">
            <Input placeholder="Enter reference number" />
          </Form.Item>
          
          <Form.Item label="Upload Receipt (Optional)">
            <Upload
              beforeUpload={() => false} // prevent auto upload
              onChange={handleUploadChange}
              fileList={fileList}
              maxCount={1}
              accept="image/*,.pdf"
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={uploading} block>
              Submit for Verification
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
