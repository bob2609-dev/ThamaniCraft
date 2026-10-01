import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Table, Typography, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import * as api from '../services/financeApi';
import usePermissions from '../hooks/usePermissions';
import dayjs from 'dayjs';

const money = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const options = (items) => items.map(value => ({ value, label: value.replaceAll('_', ' ') }));
const expenseCategories = options(['RENT', 'UTILITIES', 'MAINTENANCE', 'TRANSPORT', 'OTHER']);

function QuickExpenseModal({ open, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // default date to today
  useEffect(() => {
    if (open) {
      form.setFieldsValue({ 
        expenseDate: dayjs().format('YYYY-MM-DD'),
        category: 'OTHER'
      });
    } else {
      form.resetFields();
    }
  }, [open, form]);

  async function save(values) {
    if (saving) return;
    setSaving(true); setError('');
    try { 
      await api.quickExpense(values); 
      onSaved(); 
      onClose(); 
    } catch (failure) { 
      setError(failure.message); 
    } finally { 
      setSaving(false); 
    }
  }

  return (
    <Modal 
      title="Quick Expense" 
      open={open} 
      width={760}
      onOk={() => form.submit()} 
      onCancel={() => !saving && onClose()} 
      confirmLoading={saving} 
      okText="Record Expense"
      okButtonProps={{ style: { background: '#F59E0B', borderColor: '#F59E0B' } }}
      mask={{ closable: !saving }} 
      keyboard={!saving} 
      closable={!saving} 
      cancelButtonProps={{ disabled: saving }}
    >
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" onFinish={save} disabled={saving}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="title" label="Expense description" rules={[{ required: true, whitespace: true }]}>
              <Input maxLength={255} placeholder="e.g. Electricity Bill" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Select options={expenseCategories} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="expenseDate" label="Expense date" rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="amount" label="Expense amount (TZS)" rules={[{ required: true }]}>
              <InputNumber min={0.01} max={999999999999.99} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="reference" label="Receipt / reference (optional)">
              <Input maxLength={255} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="notes" label="Notes (optional)">
              <Input.TextArea rows={2} maxLength={4000} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

export default function Expenses() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission('VIEW_FINANCE');
  const canEdit = hasPermission('MANAGE_FINANCE');
  
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  function reload() { setLoading(true); setRevision(v => v + 1); }

  useEffect(() => {
    if (!canView) return;
    let active = true;
    api.getExpenses().then((data) => {
      if (active) { setExpenses(data); setError(''); }
    }).catch(failure => { 
      if (active) setError(failure.message); 
    }).finally(() => { 
      if (active) setLoading(false); 
    });
    return () => { active = false; };
  }, [canView, revision]);

  if (!canView) return <Alert type="warning" title="Finance viewing permission is required." />;

  const expenseColumns = [
    { title: 'Date', dataIndex: 'expenseDate', sorter: (a, b) => new Date(a.expenseDate) - new Date(b.expenseDate) },
    { title: 'Description', dataIndex: 'title' },
    { title: 'Category', dataIndex: 'category', render: (val) => val.replaceAll('_', ' ') },
    { title: 'Amount (TZS)', dataIndex: 'amount', render: money, align: 'right', sorter: (a, b) => a.amount - b.amount },
    { title: 'Reference', dataIndex: 'reference' }
  ];

  const notesExpandable = { 
    expandedRowRender: record => <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record.notes}</Typography.Paragraph>, 
    rowExpandable: record => Boolean(record.notes) 
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <Space wrap style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>Expenses</Typography.Title>
        {canEdit && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setModalVisible(true)}
            style={{ background: '#F59E0B', borderColor: '#F59E0B' }}
          >
            Record Expense
          </Button>
        )}
      </Space>

      {error && <Alert type="error" showIcon title={error} action={<Button onClick={reload}>Retry</Button>} style={{ marginBottom: 16 }} />}
      
      <Card className="glass-panel dark:bg-slate-800" style={{ borderRadius: 12 }}>
        <Table 
          rowKey="id" 
          loading={loading} 
          dataSource={expenses} 
          columns={expenseColumns} 
          expandable={notesExpandable} 
          scroll={{ x: 850 }} 
          pagination={{ pageSize: 20 }}
        />
      </Card>
      
      <QuickExpenseModal 
        open={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSaved={reload} 
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
