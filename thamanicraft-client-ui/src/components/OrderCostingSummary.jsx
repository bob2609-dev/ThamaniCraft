import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd';

export default function OrderCostingSummary({ order }) {
  if (!order || !order.items || !order.items.length) return null;

  const summary = order.costingSummary || {};
  const subtotal = Number(order.subtotal || 0);
  const totalStandardCost = Number(summary.totalStandardCost || 0);
  const estimatedProfit = Number(summary.estimatedProfit || (subtotal - totalStandardCost));
  const estimatedMarginPct = Number(summary.estimatedMarginPct || (subtotal > 0 ? (estimatedProfit / subtotal) * 100 : 0));

  const hasActuals = !!summary.hasActualCosts;
  const totalActualCost = Number(summary.totalActualCost || 0);
  const actualProfit = Number(summary.actualProfit || 0);
  const actualMarginPct = Number(summary.actualMarginPct || 0);

  const profitColor = (pct) => (pct >= 20 ? '#52c41a' : pct > 0 ? '#1890ff' : '#ff4d4f');

  return (
    <Card className="dark:bg-slate-800" title="Order Costing & Profit Margin Analysis" style={{ marginTop: 24, marginBottom: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Statistic title="Selling Price (Subtotal)" value={subtotal} precision={2} prefix="TZS " />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="Standard Recipe Cost (Est.)" value={totalStandardCost} precision={2} prefix="TZS " />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Estimated Gross Margin"
            value={estimatedMarginPct}
            precision={2}
            suffix="%"
            valueStyle={{ color: profitColor(estimatedMarginPct) }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Profit: TZS {estimatedProfit.toFixed(2)}
          </Typography.Text>
        </Col>
        <Col xs={12} sm={6}>
          {hasActuals ? (
            <>
              <Statistic
                title="Actual Batch Margin"
                value={actualMarginPct}
                precision={2}
                suffix="%"
                valueStyle={{ color: profitColor(actualMarginPct) }}
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Actual Cost: TZS {totalActualCost.toFixed(2)} (Profit: TZS {actualProfit.toFixed(2)})
              </Typography.Text>
            </>
          ) : (
            <>
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                Actual Production Cost
              </Typography.Text>
              <Tag color="default">Pending Batch Completion</Tag>
            </>
          )}
        </Col>
      </Row>

      <Typography.Title level={5}>Itemized Cost Breakdown</Typography.Title>
      <Table
        rowKey="id"
        dataSource={order.items}
        pagination={false}
        scroll={{ x: 800 }}
        columns={[
          { title: 'Item', dataIndex: 'description' },
          { title: 'Qty', dataIndex: 'quantity' },
          { title: 'Selling Price (TZS)', dataIndex: 'lineTotal', render: v => Number(v || 0).toFixed(2) },
          { title: 'Recipe Standard Cost (TZS)', dataIndex: 'standardCost', render: v => v != null ? Number(v).toFixed(2) : '—' },
          {
            title: 'Work Order Status',
            dataIndex: 'workOrderStatus',
            render: (v, r) => r.workOrderId ? <Tag color={v === 'COMPLETED' ? 'green' : 'blue'}>{v || 'GENERATED'}</Tag> : <Tag>Unlinked</Tag>
          },
          {
            title: 'Actual Batch Cost (TZS)',
            dataIndex: 'actualBatchCost',
            render: v => v != null ? Number(v).toFixed(2) : '—'
          },
          {
            title: 'Actual Margin %',
            key: 'margin',
            render: (_, r) => {
              const lineSell = Number(r.lineTotal || 0);
              const actualCost = r.actualBatchCost != null ? Number(r.actualBatchCost) : null;
              if (lineSell <= 0 || actualCost == null) return '—';
              const marginPct = ((lineSell - actualCost) / lineSell) * 100;
              return <Tag color={profitColor(marginPct)}>{marginPct.toFixed(1)}%</Tag>;
            }
          }
        ]}
      />
    </Card>
  );
}
