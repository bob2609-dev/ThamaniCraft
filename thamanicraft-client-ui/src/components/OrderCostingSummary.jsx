import { App, Button, Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { getRecipe, listRecipes } from '../services/recipeApi';
import { generateWorkOrder, mapOrderRecipe } from '../services/salesApi';
import usePermissions from '../hooks/usePermissions';
import { Form, InputNumber, Modal, Select } from 'antd';
import { withSorters } from '../utils/tableUtils';
import SearchableTable from './SearchableTable';

function RecipeDetails({ recipeId }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recipeId) {
      getRecipe(recipeId).then(setRecipe).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [recipeId]);

  if (loading) return <Typography.Text type="secondary">Loading recipe details...</Typography.Text>;
  if (!recipe) return <Typography.Text type="secondary">Recipe details unavailable.</Typography.Text>;

  return (
    <div style={{ padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 4 }} className="dark:bg-slate-700">
      <Typography.Text strong>Base Recipe: {recipe.name}</Typography.Text>
      <SearchableTable 
        size="small"
        dataSource={recipe.costing?.lines || []}
        pagination={false}
        rowKey={r => r.rawMaterialId || r.id || Math.random()}
        columns={[
          { title: 'Material', dataIndex: 'name' },
          { title: 'Qty', dataIndex: 'quantity' },
          { title: 'Unit', dataIndex: 'unit' },
          { title: 'Cost/Unit', dataIndex: 'unitCost', render: v => v != null ? Number(v).toFixed(2) : '—' },
          { title: 'Total Cost (TZS)', dataIndex: 'lineCost', render: v => v != null ? Number(v).toFixed(2) : '—' }
        ]}
      />
    </div>
  );
}

function MapRecipeModal({ visible, onClose, onMapped, orderId, item, orderVersion }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (visible) {
      listRecipes().then(setRecipes).catch(() => {});
      form.setFieldsValue({ recipeId: null, outputPerItem: 1 });
    }
  }, [visible]);

  async function handleOk() {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await mapOrderRecipe(orderId, item.id, { ...values, version: orderVersion });
      message.success('Recipe mapped successfully');
      onMapped();
    } catch (e) {
      if (e.message) message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={`Map Recipe for ${item?.description}`}
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="recipeId" label="Recipe" rules={[{ required: true, message: 'Please select a recipe' }]}>
          <Select 
            placeholder="Select a recipe" 
            showSearch
            optionFilterProp="children"
            options={recipes.map(r => ({ value: r.id, label: r.name }))}
          />
        </Form.Item>
        <Form.Item name="outputPerItem" label="Recipe Output per Ordered Item" rules={[{ required: true }]}>
          <InputNumber min={0.01} step={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}


export default function OrderCostingSummary({ order, onChanged }) {
  const { message } = App.useApp();
  const { hasPermission } = usePermissions();
  const [generating, setGenerating] = useState(false);
  const [mappingItem, setMappingItem] = useState(null);

  if (!order || !order.items || !order.items.length) return null;

  const canGenerate = order.status === 'CONFIRMED' && hasPermission('EXECUTE_PRODUCTION');

  async function handleGenerate(row) {
    if (generating) return;
    setGenerating(true);
    try {
      await generateWorkOrder(order.id, row.id, order.version);
      message.success('Work order generated');
      if (onChanged) await onChanged();
    } catch (e) {
      message.error(e.message);
    } finally {
      setGenerating(false);
    }
  }

  const summary = order.costingSummary || {};
  const subtotal = Number(order.subtotal || 0);
  const totalStandardCost = Number(summary.totalStandardCost || 0);
  const estimatedProfit = summary.estimatedProfit != null ? Number(summary.estimatedProfit) : (subtotal - totalStandardCost);
  const estimatedMarginPct = summary.estimatedMarginPct != null ? Number(summary.estimatedMarginPct) : (subtotal > 0 ? (estimatedProfit / subtotal) * 100 : 0);

  const hasActuals = !!summary.hasActualCosts;
  const totalActualCost = Number(summary.totalActualCost || 0);
  const actualProfit = summary.actualProfit != null ? Number(summary.actualProfit) : 0;
  const actualMarginPct = summary.actualMarginPct != null ? Number(summary.actualMarginPct) : 0;

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
            title={
              <span>
                Estimated Gross Margin
                {summary.incompleteEst && (
                  <span style={{ color: '#faad14', marginLeft: 8, fontSize: 12, fontWeight: 'normal' }}>
                    (Incomplete cost data)
                  </span>
                )}
              </span>
            }
            value={estimatedMarginPct}
            precision={2}
            suffix="%"
            styles={{ content: { color: profitColor(estimatedMarginPct) } }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Profit: TZS {estimatedProfit.toFixed(2)}
          </Typography.Text>
        </Col>
        <Col xs={12} sm={6}>
          {hasActuals ? (
            <>
              <Statistic
                title={
                  <span>
                    Actual Batch Margin
                    {summary.incompleteAct && (
                      <span style={{ color: '#faad14', marginLeft: 8, fontSize: 12, fontWeight: 'normal' }}>
                        (Incomplete cost data)
                      </span>
                    )}
                  </span>
                }
                value={actualMarginPct}
                precision={2}
                suffix="%"
                styles={{ content: { color: profitColor(actualMarginPct) } }}
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
      <SearchableTable
        rowKey="id"
        dataSource={order.items}
        pagination={false}
        scroll={{ x: 800 }}
        expandable={{
          expandedRowRender: (record) => {
            if (record.recipeId) return <RecipeDetails recipeId={record.recipeId} />;
            if (record.finishedProductId) return <Typography.Text type="secondary" className="pl-6">This is a finished product. Its standard cost is managed in Inventory.</Typography.Text>;
            return <Typography.Text type="secondary" className="pl-6">No recipe is mapped for this custom item.</Typography.Text>;
          }
        }}
        columns={[
          { title: 'Item', dataIndex: 'description' },
          { title: 'Qty', dataIndex: 'quantity' },
          { title: 'Selling Price (TZS)', dataIndex: 'lineTotal', render: v => Number(v || 0).toFixed(2) },
          { 
            title: 'Estimated Cost (TZS)', 
            dataIndex: 'standardCost', 
            render: (v, r) => {
              if (r.finishedProductId && r.unitCost) {
                return Number(r.unitCost * r.quantity).toFixed(2);
              }
              return v != null ? Number(v).toFixed(2) : '—';
            }
          },
          {
            title: 'Work Order Status',
            dataIndex: 'workOrderStatus',
            render: (v, r) => r.workOrderId ? <Tag color={v === 'COMPLETED' ? 'green' : 'blue'}>{v || 'GENERATED'}</Tag> : (r.finishedProductId ? <Tag>Inventory</Tag> : <Tag>Unlinked</Tag>)
          },
          {
            title: 'Actual Cost (TZS)',
            dataIndex: 'actualBatchCost',
            render: (v, r) => {
              if (v != null) return Number(v).toFixed(2);
              if (r.finishedProductId && r.unitCost) return Number(r.unitCost * r.quantity).toFixed(2);
              return '—';
            }
          },
          {
            title: 'Actual Margin %',
            key: 'margin',
            render: (_, r) => {
              const lineSell = Number(r.lineTotal || 0);
              let actualCost = null;
              if (r.actualBatchCost != null) actualCost = Number(r.actualBatchCost);
              else if (r.finishedProductId && r.unitCost != null) actualCost = Number(r.unitCost * r.quantity);
              
              if (lineSell <= 0 || actualCost == null) return '—';
              const marginPct = ((lineSell - actualCost) / lineSell) * 100;
              return <Tag color={profitColor(marginPct)}>{marginPct.toFixed(2)}%</Tag>;
            }
          },
          {
            title: 'Actions',
            key: 'actions',
            render: (_, r) => {
              if (r.finishedProductId) return null;
              if (r.workOrderId) return null;
              if (!r.recipeId) {
                if (order.status !== 'NEW' && order.status !== 'CONFIRMED') return <Typography.Text type="secondary" style={{fontSize: 12}}>No recipe</Typography.Text>;
                return <Button type="default" size="small" onClick={() => setMappingItem(r)}>Map Recipe</Button>;
              }
              if (!canGenerate) return null;
              return <Button type="primary" size="small" disabled={generating} onClick={() => handleGenerate(r)}>Generate WO</Button>;
            }
          }
        ]}
      />
      <MapRecipeModal
        visible={!!mappingItem}
        item={mappingItem}
        orderId={order.id}
        orderVersion={order.version}
        onClose={() => setMappingItem(null)}
        onMapped={() => {
          setMappingItem(null);
          if (onChanged) onChanged();
        }}
      />
    </Card>
  );
}
