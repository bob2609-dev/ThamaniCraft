import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Table, Tabs, Typography } from 'antd';
import * as api from '../services/financeApi';
import usePermissions from '../hooks/usePermissions';

const money = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const options = (items) => items.map(value => ({ value, label: value.replaceAll('_', ' ') }));
const assetCategories = options(['MACHINERY', 'TOOLS', 'IT_HARDWARE', 'VEHICLE', 'LEASEHOLD']);
const expenseCategories = options(['RENT', 'UTILITIES', 'MAINTENANCE', 'TRANSPORT', 'OTHER']);
const statuses = options(['ACTIVE', 'MAINTENANCE', 'DISPOSED', 'WRITTEN_OFF']);

function RecordEditor({ kind, record, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const asset = kind === 'assets';
  async function save(values) {
    if (saving) return;
    setSaving(true); setError('');
    try { await api.saveFinanceRecord(kind, record?.id, values); onSaved(); onClose(); }
    catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  }
  return <Modal title={`${record?.id ? 'Edit' : 'Record'} ${asset ? 'equipment purchase' : 'expense'}`} open width={760}
    onOk={() => form.submit()} onCancel={() => !saving && onClose()} confirmLoading={saving} okText="Save record"
    maskClosable={!saving} keyboard={!saving} closable={!saving} cancelButtonProps={{ disabled: saving }}>
    {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
    <Form form={form} layout="vertical" onFinish={save} scrollToFirstError disabled={saving}
      initialValues={record || (asset ? { status: 'ACTIVE', category: 'MACHINERY' } : { category: 'RENT' })}>
      <Row gutter={16}>
        <Col span={24}><Form.Item name={asset ? 'name' : 'title'} label={asset ? 'Equipment name' : 'Expense description'} rules={[{ required: true, whitespace: true }]}><Input maxLength={255} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="category" label="Category" rules={[{ required: true }]}><Select options={asset ? assetCategories : expenseCategories} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name={asset ? 'purchaseDate' : 'expenseDate'} label={asset ? 'Purchase date' : 'Expense date'} rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name={asset ? 'purchaseCost' : 'amount'} label={asset ? 'Purchase amount (TZS)' : 'Expense amount (TZS)'} rules={[{ required: true }]}>
          <InputNumber min={0} max={999999999999.99} precision={2} style={{ width: '100%' }} />
        </Form.Item></Col>
        {asset && <Col xs={24} md={12}><Form.Item name="status" label="Equipment status" rules={[{ required: true }]}><Select options={statuses} /></Form.Item></Col>}
        <Col xs={24} md={12}><Form.Item name="reference" label="Receipt / reference (optional)"><Input maxLength={255} /></Form.Item></Col>
        <Col span={24}><Form.Item name="notes" label="Notes (optional)" extra="For rent, you can note the period covered. No monthly allocation is calculated."><Input.TextArea rows={3} maxLength={4000} /></Form.Item></Col>
      </Row>
    </Form>
  </Modal>;
}

export default function Assets() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission('VIEW_FINANCE');
  const canEdit = hasPermission('MANAGE_FINANCE');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  function reload() { setLoading(true); setRevision(v => v + 1); }
  useEffect(() => {
    if (!canView) return;
    let active = true;
    Promise.all([api.getAssets(), api.getExpenses(), api.getLeases()]).then(([assets, expenses, leases]) => {
      if (active) { setData({ assets, expenses, leases }); setError(''); }
    }).catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canView, revision]);
  if (!canView) return <Alert type="warning" title="Finance viewing permission is required." />;
  const action = (kind) => ({ title: 'Actions', key: 'actions', render: (_, record) => canEdit && <Button onClick={() => setEditor({ kind, record })}>Edit</Button> });
  const assetColumns = [
    { title: 'Equipment', dataIndex: 'name' }, { title: 'Category', dataIndex: 'category' },
    { title: 'Purchase date', dataIndex: 'purchaseDate' },
    { title: 'Purchase amount (TZS)', dataIndex: 'purchaseCost', render: money, align: 'right' },
    { title: 'Status', dataIndex: 'status' }, { title: 'Reference', dataIndex: 'reference' }, action('assets'),
  ];
  const expenseColumns = [
    { title: 'Date', dataIndex: 'expenseDate' }, { title: 'Description', dataIndex: 'title' },
    { title: 'Category', dataIndex: 'category' },
    { title: 'Amount (TZS)', dataIndex: 'amount', render: money, align: 'right' },
    { title: 'Reference', dataIndex: 'reference' }, action('expenses'),
  ];
  const notes = { expandedRowRender: record => <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record.notes}</Typography.Paragraph>, rowExpandable: record => Boolean(record.notes) };
  const tabs = [
    { key: 'assets', label: 'Equipment purchases', children: <>
      {canEdit && <Button type="primary" onClick={() => setEditor({ kind: 'assets', record: null })} style={{ marginBottom: 16 }}>Record purchase</Button>}
      <Table rowKey="id" loading={loading} dataSource={data?.assets || []} columns={assetColumns} expandable={notes} scroll={{ x: 950 }} />
    </> },
    { key: 'expenses', label: 'Rent & other expenses', children: <>
      {canEdit && <Button type="primary" onClick={() => setEditor({ kind: 'expenses', record: null })} style={{ marginBottom: 16 }}>Record expense</Button>}
      <Table rowKey="id" loading={loading} dataSource={data?.expenses || []} columns={expenseColumns} expandable={notes} scroll={{ x: 850 }} />
    </> },
  ];
  if (data?.leases.length) tabs.push({ key: 'leases', label: 'Previous lease agreements', children: <>
    <Alert type="info" showIcon title="Historical agreements, not expense payments" description="These records are preserved for reference. Record actual rent separately in Rent & other expenses; nothing is allocated to recipes." style={{ marginBottom: 16 }} />
    <Table rowKey="id" dataSource={data.leases} scroll={{ x: 750 }} columns={[
      { title: 'Lease', dataIndex: 'title' }, { title: 'Start', dataIndex: 'startDate' },
      { title: 'End', dataIndex: 'endDate' }, { title: 'Agreement amount (TZS)', dataIndex: 'totalAmount', render: money },
    ]} />
  </> });
  return <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
    <Typography.Title level={2}>Assets & Overheads</Typography.Title>
    <Typography.Paragraph>Manually record equipment purchases, rent and other expenses. No depreciation, production forecasts or automatic recipe charges.</Typography.Paragraph>
    {error && <Alert type="error" showIcon title={error} action={<Button onClick={reload}>Retry</Button>} style={{ marginBottom: 16 }} />}
    <Card className="dark:bg-slate-800"><Tabs items={tabs} /></Card>
    {editor && <RecordEditor {...editor} onClose={() => setEditor(null)} onSaved={reload} />}
  </div>;
}
