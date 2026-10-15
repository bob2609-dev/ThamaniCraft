import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Typography, Tabs, Table, Card, Tag, Descriptions, Row, Col, Spin, Alert } from 'antd';
import api from '../utils/api';

const { Title } = Typography;

export default function PlatformLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeKey = (tabParam === 'audit' || tabParam === '1') ? '1' : '1';

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load audit logs.');
    } finally {
      setLoadingLogs(false);
    }
  };


  const logColumns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: t => new Date(t).toLocaleString() },
    { title: 'Action', dataIndex: 'action', key: 'action', render: text => <Tag color="blue">{text}</Tag> },
    { title: 'Actor', dataIndex: 'actorName', key: 'actorName', render: (text, record) => `${text} (${record.actorEmail})` },
    { title: 'Entity Type', dataIndex: 'entityType', key: 'entityType' },
    { title: 'Details', dataIndex: 'details', key: 'details' }
  ];


  return (
    <div>
      <Title level={2}>Audit & Monitoring</Title>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      
      <Tabs 
        activeKey={activeKey} 
        onChange={(key) => setSearchParams({ tab: key === '1' ? 'audit' : key }, { replace: true })}
      >
        <Tabs.TabPane tab="Audit Logs" key="1">
          <Table 
            columns={logColumns} 
            dataSource={logs} 
            rowKey="id" 
            loading={loadingLogs}
            pagination={{ pageSize: 20 }}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}
