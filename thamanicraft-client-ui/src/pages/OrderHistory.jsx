import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { listOrders } from '../services/salesApi';
import usePermissions from '../hooks/usePermissions';

export default function OrderHistory() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canView = hasPermission('VIEW_SALES');
  
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState('OPEN');
  const [paymentStatus, setPaymentStatus] = useState('ALL');

  useEffect(() => {
    if (!canView) return;
    let active = true;
    listOrders().then(data => {
      if (active) { setRows(data); setError(''); }
    }).catch(e => {
      if (active) setError(e.message);
    });
    return () => { active = false; };
  }, [canView, revision]);

  if (!canView) return <Alert type="warning" message="Sales viewing permission required." />;

  return (
    <div>
      <Space wrap style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Order History</Typography.Title>
        {hasPermission('PROCESS_SALES') && <Button type="primary" onClick={() => navigate('/sales/new')}>Advanced Order</Button>}
      </Space>
      
      {error && <Alert type="error" message={error} action={<Button onClick={() => setRevision(v => v + 1)}>Retry</Button>} style={{ marginBottom: 16 }} />}
      
      <Card className="glass-panel" style={{ borderRadius: 12 }}>
        <Input 
          aria-label="Search orders" 
          placeholder="Search customer, phone or order ID" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ maxWidth: 400, marginBottom: 16 }} 
          allowClear
        />
        <Select 
          aria-label="Filter order status" 
          value={status} 
          onChange={setStatus} 
          style={{ minWidth: 180, marginBottom: 16, marginLeft: 12 }}
          options={['OPEN', 'ALL', 'NEW', 'CONFIRMED', 'CANCELLED', 'OVERDUE'].map(value => ({ value, label: value }))}
        />
        <Select 
          aria-label="Filter payment status" 
          value={paymentStatus} 
          onChange={setPaymentStatus} 
          style={{ minWidth: 180, marginLeft: 12 }}
          options={['ALL', 'UNPAID', 'PARTIAL', 'PAID', 'REFUND_DUE'].map(value => ({ value, label: value === 'ALL' ? 'All payment statuses' : value }))}
        />
        
        <Table 
          rowKey="id" 
          dataSource={rows
            .filter(r => `${r.orderNumber} ${r.id} ${r.customerName} ${r.customerPhone}`.toLowerCase().includes(search.toLowerCase()))
            .filter(r => status === 'ALL' || (status === 'OPEN' ? !['CANCELLED', 'DELIVERED', 'COLLECTED'].includes(r.status) : status === 'OVERDUE' ? !['CANCELLED', 'DELIVERED', 'COLLECTED'].includes(r.status) && new Date(r.dueAt) < new Date() : r.status === status))
            .filter(r => paymentStatus === 'ALL' || r.paymentStatus === paymentStatus)}
          scroll={{ x: 1050 }} 
          columns={[
            { title: 'Order', dataIndex: 'orderNumber', sorter: (a, b) => a.orderNumber.localeCompare(b.orderNumber) },
            { title: 'Customer', dataIndex: 'customerName', sorter: (a, b) => a.customerName?.localeCompare(b.customerName) },
            { title: 'Phone', dataIndex: 'customerPhone' },
            { title: 'Date', dataIndex: 'createdAt', render: v => new Date(v).toLocaleDateString(), sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
            { title: 'Status', dataIndex: 'status', sorter: (a, b) => a.status.localeCompare(b.status) },
            { title: 'Fulfillment', dataIndex: 'fulfillmentStatus', render: v => <Tag color={v === 'FULFILLED' ? 'green' : 'orange'}>{v || 'UNFULFILLED'}</Tag> },
            { title: 'Total (TZS)', dataIndex: 'total', render: v => Number(v)?.toLocaleString(), sorter: (a, b) => Number(a.total) - Number(b.total) },
            { title: 'Net paid (TZS)', dataIndex: 'netPaid', render: v => Number(v)?.toLocaleString() },
            { title: 'Balance (TZS)', dataIndex: 'balance', render: v => Number(v)?.toLocaleString() },
            { title: 'Payment', dataIndex: 'paymentStatus' },
            { title: 'Actions', key: 'actions', render: (_, r) => <Button onClick={() => navigate(`/sales/${r.id}`)}>Open</Button> },
          ]} 
        />
      </Card>
    </div>
  );
}
