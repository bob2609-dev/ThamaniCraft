import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Table, Alert, Spin, Segmented, Progress } from 'antd';
import { ShopOutlined, ExperimentOutlined, AppstoreOutlined, BuildOutlined, FireOutlined } from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { listOrders } from '../services/salesApi';
import { listWorkOrders } from '../services/productionApi';
import { fetchRawMaterials, fetchFinishedProducts } from '../services/inventoryApi';
import dayjs from 'dayjs';
import { useTheme } from '../ThemeContext';

const { Title, Text } = Typography;

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    sales: [],
    workOrders: [],
    rawMaterials: [],
    finishedProducts: []
  });
  const [chartDays, setChartDays] = useState(7);

  useEffect(() => {
    async function loadData() {
      try {
        const [sales, workOrders, rawMaterials, finishedProducts] = await Promise.all([
          listOrders().catch(() => []),
          listWorkOrders().catch(() => []),
          fetchRawMaterials().catch(() => []),
          fetchFinishedProducts().catch(() => [])
        ]);
        
        setData({ 
          sales: sales.reverse(), 
          workOrders: workOrders.reverse(), 
          rawMaterials, 
          finishedProducts 
        });
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const pendingSales = data.sales.filter(o => o.status === 'NEW' || o.status === 'CONFIRMED').length;
  const activeWorkOrders = data.workOrders.filter(w => w.status === 'IN_PROGRESS' || w.status === 'COMPLETION_PENDING').length;
  const lowStockMaterials = data.rawMaterials.filter(m => m.stockQuantity <= (m.reorderLevel || 10));

  // Generate chart data based on chartDays
  const startDate = dayjs().subtract(chartDays - 1, 'day').startOf('day');
  const filteredSales = data.sales.filter(o => dayjs(o.createdAt).isAfter(startDate));
  
  const salesByDate = {};
  for (let i = 0; i < chartDays; i++) {
    const d = startDate.add(i, 'day').format('YYYY-MM-DD');
    salesByDate[d] = { revenue: 0, profit: 0 };
  }
  
  filteredSales.forEach(order => {
    const d = dayjs(order.createdAt).format('YYYY-MM-DD');
    if (salesByDate[d]) {
      salesByDate[d].revenue += order.totalAmount || 0;
      const cost = order.costingSummary?.actualCost || order.costingSummary?.standardCost || 0;
      salesByDate[d].profit += (order.totalAmount || 0) - cost;
    }
  });
  
  const chartData = Object.keys(salesByDate).map(date => ({
    date: dayjs(date).format('MMM DD'),
    revenue: salesByDate[date].revenue,
    profit: salesByDate[date].profit
  }));

  // Top products
  const productSales = {};
  data.sales.forEach(order => {
    (order.lines || []).forEach(line => {
      const pId = line.product?.id || 'Unknown';
      if (!productSales[pId]) {
        productSales[pId] = { name: line.product?.name || 'Unknown', revenue: 0, quantity: 0 };
      }
      productSales[pId].revenue += (line.unitPrice * line.quantity);
      productSales[pId].quantity += line.quantity;
    });
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxRevenue = Math.max(...topProducts.map(p => p.revenue), 1);

  return (
    <div>
      <Title level={2}>Operational Dashboard</Title>
      
      {(() => {
        const colors = {
          blue: isDark ? '#60a5fa' : '#1890ff',
          orange: isDark ? '#fbbf24' : '#faad14',
          green: isDark ? '#34d399' : '#10B981',
          indigo: isDark ? '#818cf8' : '#6366F1'
        };
        
        return (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="glass-panel" 
            style={{ borderRadius: '14px', border: '1px solid var(--border-subtle)' }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Pending Sales</Text>
                <Title level={3} style={{ margin: '8px 0 0 0', fontWeight: 700, color: pendingSales > 0 ? colors.blue : 'inherit' }}>{pendingSales}</Title>
              </div>
              <div style={{ background: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(24, 144, 255, 0.1)', padding: 10, borderRadius: 10, color: colors.blue }}>
                <ShopOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="glass-panel" 
            style={{ borderRadius: '14px', border: '1px solid var(--border-subtle)' }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Active Batches</Text>
                <Title level={3} style={{ margin: '8px 0 0 0', fontWeight: 700, color: activeWorkOrders > 0 ? colors.orange : 'inherit' }}>{activeWorkOrders}</Title>
              </div>
              <div style={{ background: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(250, 173, 20, 0.1)', padding: 10, borderRadius: 10, color: colors.orange }}>
                <ExperimentOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="glass-panel" 
            style={{ borderRadius: '14px', border: '1px solid var(--border-subtle)' }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Raw Materials</Text>
                <Title level={3} style={{ margin: '8px 0 0 0', fontWeight: 700 }}>{data.rawMaterials.length}</Title>
              </div>
              <div style={{ background: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 10, color: colors.green }}>
                <AppstoreOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="glass-panel" 
            style={{ borderRadius: '14px', border: '1px solid var(--border-subtle)' }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Finished Goods</Text>
                <Title level={3} style={{ margin: '8px 0 0 0', fontWeight: 700 }}>{data.finishedProducts.length}</Title>
              </div>
              <div style={{ background: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.1)', padding: 10, borderRadius: 10, color: colors.indigo }}>
                <BuildOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      {lowStockMaterials.length > 0 && (
        <Alert
          message="Low Stock Alerts"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {lowStockMaterials.map(m => (
                <li key={m.id}>
                  <strong>{m.name}</strong> - Current Stock: {m.stockQuantity} {m.uom?.abbreviation || ''} (Reorder at: {m.reorderLevel || 10})
                </li>
              ))}
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8, border: '1px solid #ffe58f' }}
        />
      )}
      
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card 
            className="glass-panel" 
            style={{ borderRadius: '16px', border: '1px solid var(--border-subtle)' }}
            title={<span style={{ fontWeight: 600, fontSize: '16px' }}>Sales Revenue & Profit Trajectory</span>}
            extra={
              <Segmented 
                options={[{ label: '7D', value: 7 }, { label: '30D', value: 30 }]}
                value={chartDays}
                onChange={setChartDays}
              />
            }
          >
            <div style={{ height: 340, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#1E40AF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} dx={-10} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value, name) => [`TZS ${value.toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Gross Profit']}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1E40AF" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            className="glass-panel" 
            style={{ height: '100%', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}
            title={<span style={{ fontWeight: 600, fontSize: '16px' }}><FireOutlined style={{ color: '#D97706', marginRight: 8 }} />Top Products by Sales</span>}
          >
            {topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>No product sales recorded</div>
            ) : (
              <div>
                {topProducts.map((product, idx) => (
                  <div key={idx} style={{ marginBottom: idx !== topProducts.length - 1 ? '20px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ flex: 1, overflow: 'hidden', paddingRight: 8 }}>
                        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          #{idx + 1} {product.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                          {product.quantity} units sold
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: colors.green }}>
                        TZS {product.revenue.toLocaleString()}
                      </div>
                    </div>
                    <Progress 
                      percent={Math.round((product.revenue / maxRevenue) * 100)} 
                      showInfo={false} 
                      strokeColor={idx === 0 ? colors.blue : colors.green}
                      size="small"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card className="glass-panel" title={<span style={{ fontWeight: 600 }}>Recent Sales Orders</span>} bordered={false} style={{ borderRadius: '16px' }}>
            <Table 
              dataSource={data.sales.slice(0, 5)} 
              rowKey="id" 
              pagination={false}
              size="small"
              columns={[
                { title: 'Order ID', dataIndex: 'id', render: id => <Text strong>{id.substring(0, 8)}</Text> },
                { title: 'Customer', dataIndex: 'customerName' },
                { title: 'Total (TZS)', dataIndex: 'totalAmount', render: val => val?.toLocaleString() },
                { title: 'Status', dataIndex: 'status' }
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="glass-panel" title={<span style={{ fontWeight: 600 }}>Recent Work Orders</span>} bordered={false} style={{ borderRadius: '16px' }}>
            <Table 
              dataSource={data.workOrders.slice(0, 5)} 
              rowKey="id" 
              pagination={false}
              size="small"
              columns={[
                { title: 'Batch ID', dataIndex: 'id', render: id => <Text strong>{id.substring(0, 8)}</Text> },
                { title: 'Recipe', dataIndex: 'recipeName' },
                { title: 'Target Qty', dataIndex: 'targetQuantity' },
                { title: 'Status', dataIndex: 'status' }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <style jsx global>{`
        .glass-panel {
          background: var(--component-background) !important;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
      `}</style>
          </>
        );
      })()}
    </div>
  );
}
