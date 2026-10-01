import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined, ExperimentOutlined } from '@ant-design/icons';
import { listWorkOrders } from '../services/productionApi';
import usePermissions from '../hooks/usePermissions';
import QuickMakeModal from '../components/QuickMakeModal';

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
  const [makeVisible, setMakeVisible] = useState(false);
  
  const loadData = () => {
    let active = true;
    setLoading(true);
    listWorkOrders().then(data => { if (active) { setRows(data); setError(''); } })
      .catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  };

  useEffect(() => {
    if (!canView) return;
    return loadData();
  }, [canView, revision]);
  if (!canView) return <Alert type="warning" title="Production viewing permission is required." />;
  const filtered = rows.filter(row => (!status || row.status === status) &&
    `${row.reference || ''} ${row.recipeName || ''} ${row.id}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
    <Space wrap style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
      <Typography.Title level={2} style={{ margin: 0 }}>Production work orders</Typography.Title>
      <Space>
        {hasPermission('EXECUTE_PRODUCTION') && (
          <Button 
            type="primary" 
            icon={<ExperimentOutlined />} 
            onClick={() => setMakeVisible(true)}
            style={{ background: '#F59E0B', borderColor: '#F59E0B' }}
          >
            Quick Make
          </Button>
        )}
        {hasPermission('EXECUTE_PRODUCTION') && <Button icon={<PlusOutlined />} onClick={() => navigate('/production/new')}>Advanced Order</Button>}
      </Space>
    </Space>
    {error && <Alert type="error" title={error} action={<Button onClick={() => { setLoading(true); setRevision(v => v + 1); }}>Retry</Button>} style={{ marginBottom: 16 }} />}
    <Card className="dark:bg-slate-800">
      <Space wrap style={{ marginBottom: 16 }}>
        <Input aria-label="Search work orders" placeholder="Search reference or recipe" value={query} onChange={e => setQuery(e.target.value)} allowClear />
        <Select aria-label="Filter by status" placeholder="All statuses" value={status} onChange={setStatus} allowClear style={{ width: 200 }}
          options={['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETION_PENDING', 'COMPLETED', 'COMPLETION_FAILED', 'CANCELLED'].map(value => ({ value, label: value.replaceAll('_', ' ') }))} />
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
    
    <QuickMakeModal
      open={makeVisible}
      onCancel={() => setMakeVisible(false)}
      onSuccess={() => {
        setRevision(v => v + 1);
      }}
    />
  </div>;
}
