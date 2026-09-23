import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { listWorkOrders } from '../services/productionApi';
import usePermissions from '../hooks/usePermissions';

export default function Production() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canView = hasPermission('VIEW_PRODUCTION');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(null);
  useEffect(() => {
    if (!canView) return;
    let active = true;
    listWorkOrders().then(data => { if (active) { setRows(data); setError(''); } })
      .catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canView, revision]);
  if (!canView) return <Alert type="warning" title="Production viewing permission is required." />;
  const filtered = rows.filter(row => (!status || row.status === status) &&
    `${row.reference || ''} ${row.recipeName || ''} ${row.id}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
    <Space wrap style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
      <Typography.Title level={2} style={{ margin: 0 }}>Production work orders</Typography.Title>
      {hasPermission('EXECUTE_PRODUCTION') && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/production/new')}>New work order</Button>}
    </Space>
    <Alert type="info" showIcon title="Planning and starting batches are available. Completion and stock posting are not enabled yet."
      description="No inventory is reserved or deducted by these work orders." style={{ marginBottom: 16 }} />
    {error && <Alert type="error" title={error} action={<Button onClick={() => { setLoading(true); setRevision(v => v + 1); }}>Retry</Button>} style={{ marginBottom: 16 }} />}
    <Card className="dark:bg-slate-800">
      <Space wrap style={{ marginBottom: 16 }}>
        <Input aria-label="Search work orders" placeholder="Search reference or recipe" value={query} onChange={e => setQuery(e.target.value)} allowClear />
        <Select aria-label="Filter by status" placeholder="All statuses" value={status} onChange={setStatus} allowClear style={{ width: 200 }}
          options={['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'CANCELLED'].map(value => ({ value, label: value.replaceAll('_', ' ') }))} />
      </Space>
      <Table rowKey="id" loading={loading} dataSource={filtered} scroll={{ x: 950 }} columns={[
        { title: 'Reference', dataIndex: 'reference', render: (value, row) => value || row.id.slice(0, 8) },
        { title: 'Recipe', dataIndex: 'recipeName' },
        { title: 'Status', dataIndex: 'status', render: value => <Tag>{value.replaceAll('_', ' ')}</Tag> },
        { title: 'Planned output', key: 'yield', render: (_, row) => `${row.plannedYield} ${row.outputUnit || ''}` },
        { title: 'Scheduled date', dataIndex: 'scheduledDate' },
        { title: 'Planned cost (TZS)', dataIndex: 'plannedCost', align: 'right', render: value => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
        { title: 'Actions', key: 'actions', render: (_, row) => <Button onClick={() => navigate(`/production/${row.id}`)}>Open</Button> },
      ]} />
    </Card>
  </div>;
}
