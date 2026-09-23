import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, App, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Spin, Statistic, Typography } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import * as api from '../services/recipeApi';
import { fetchRawMaterials, fetchUnitsOfMeasure } from '../services/inventoryApi';
import usePermissions from '../hooks/usePermissions';
import { simulatedLineCost } from '../services/costingSimulation';

const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RecipeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('CREATE_RECIPES');
  const canView = hasPermission('VIEW_RECIPES');
  const [form] = Form.useForm();
  const [materials, setMaterials] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loadedId, setLoadedId] = useState(undefined);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [margin, setMargin] = useState(35);
  const [priceOverrides, setPriceOverrides] = useState({});
  const routeId = id || 'new';
  const values = Form.useWatch([], form) || {};
  const items = values.items || [];
  const lineCost = (item) => simulatedLineCost(item, materials, priceOverrides);
  const ingredientCost = items.reduce((total, item) => total + lineCost(item), 0);
  const batchCost = ingredientCost + Number(values.laborCostPerBatch || 0) + Number(values.energyCostPerBatch || 0) + Number(values.additionalOverheadPerBatch || 0);
  const unitCost = Number(values.yieldQuantity) > 0 ? batchCost / Number(values.yieldQuantity) : 0;


  useEffect(() => {
    if (!canView || (!id && !canEdit)) return;
    let active = true;
    Promise.all([fetchRawMaterials(), fetchUnitsOfMeasure(), id ? api.getRecipe(id) : Promise.resolve(null)])
      .then(([currentMaterials, units, recipe]) => {
        if (!active) return;
        setMaterials(currentMaterials);
        setUoms(units);
        setPriceOverrides({});
        form.resetFields();
        form.setFieldsValue(recipe ? {
          ...recipe, items: recipe.items.map((item) => ({ ...item, wastePercent: Number(item.wasteFactor) * 100 })),
        } : { yieldQuantity: 1, laborCostPerBatch: 0, energyCostPerBatch: 0, additionalOverheadPerBatch: 0, items: [{ wastePercent: 0 }] });
        setError('');
        setLoadedId(routeId);
      }).catch((failure) => { if (active) { setError(failure.message); setLoadedId(routeId); } });
    return () => { active = false; };
  }, [id, routeId, canView, canEdit, form]);

  async function save(data) {
    if (saving) return;
    setSaving(true);
    try {
      await api.saveRecipe(id, { ...data,
        items: data.items.map(({ wastePercent, ...item }) => ({ ...item, wasteFactor: Number(wastePercent || 0) / 100 })),
      });
      message.success('Recipe saved');
      navigate('/recipes');
    } catch (failure) { message.error(failure.message); }
    finally { setSaving(false); }
  }

  return <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow" style={{ width: '100%', minWidth: 0 }}>
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/recipes')} disabled={saving} style={{ marginBottom: 16 }}>Back to recipes</Button>
    <Typography.Title level={2} style={{ marginTop: 0 }}>{id ? (canEdit ? 'Edit recipe' : 'View recipe') : 'New recipe'}</Typography.Title>
    <Typography.Paragraph>Define your batch yield, ingredients, and overheads. Costs update as you edit.</Typography.Paragraph>
    {!canView || (!id && !canEdit) ? <Alert type="warning" showIcon message="You do not have permission to open this recipe page." />
      : <Spin spinning={loadedId !== routeId}>
      <div style={{ display: loadedId === routeId ? 'block' : 'none', minHeight: 120 }}>
      {error ? <Alert type="error" showIcon message="Could not load recipe" description={error} /> : <>
      <Form form={form} layout="vertical" onFinish={save} disabled={!canEdit || saving} scrollToFirstError>
        {!materials.length && <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Create raw materials in Inventory before adding recipe ingredients." />}
        <Card className="dark:bg-slate-800" title="Recipe details" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}><Form.Item name="name" label="Recipe name" rules={[{ required: true, whitespace: true }]}><Input maxLength={255} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item name="yieldQuantity" label="Output per batch" rules={[{ required: true }]}><InputNumber min={0.01} max={99999999.99} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item name="yieldUomId" label="Output unit" rules={[{ required: true }]}><Select options={uoms.map((unit) => ({ value: unit.id, label: unit.name }))} /></Form.Item></Col>
        </Row>
        </Card>
        <Card className="dark:bg-slate-800" title="Ingredients & quantities" style={{ marginBottom: 24 }}>
        <Form.List name="items" rules={[{ validator: async (_, lines) => {
          if (!lines?.length) throw new Error('Add at least one ingredient');
          const ids = lines.map((line) => line.rawMaterialId).filter(Boolean);
          if (new Set(ids).size !== ids.length) throw new Error('Combine repeated ingredients into one line');
        } }]}>
          {(fields, { add, remove }, { errors }) => <>
            {fields.map(({ key, name, ...field }) => {
              const material = materials.find((m) => m.id === items[name]?.rawMaterialId);
              return <Row key={key} gutter={12} align="top">
                <Col xs={24} md={8}><Form.Item {...field} name={[name, 'rawMaterialId']} label="Ingredient" rules={[{ required: true }]}>
                  <Select showSearch optionFilterProp="label" options={materials.map((m) => ({ value: m.id, label: `${m.name} (${m.sku || m.baseUom?.symbol})` }))} />
                </Form.Item></Col>
                <Col xs={12} md={5}><Form.Item {...field} name={[name, 'quantityRequired']} label={`Quantity (${material?.baseUom?.symbol || 'base unit'})`} rules={[{ required: true }]}>
                  <InputNumber min={0.0001} max={9999999999.9999} precision={4} style={{ width: '100%' }} />
                </Form.Item></Col>
                <Col xs={12} md={4}><Form.Item {...field} name={[name, 'wastePercent']} label="Waste (%)" rules={[{ required: true }]}>
                  <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
                </Form.Item></Col>
                <Col xs={12} md={4}><Form.Item label="Line cost (TZS)"><Typography.Text>{money(lineCost(items[name]))}</Typography.Text></Form.Item></Col>
                <Col xs={12} md={3}><Form.Item label=" "><Button danger onClick={() => remove(name)} aria-label={`Remove ingredient ${name + 1}`}>Remove</Button></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item label={`Simulated price per ${material?.baseUom?.symbol || 'base unit'} (TZS)`}
                  extra={`Inventory cost: ${material?.costPerBaseUnit ?? '—'}. Optional; never saved to inventory or the recipe.`}>
                  <InputNumber min={0} max={9999999999.9999} precision={4} disabled={!material || saving}
                    placeholder="Use inventory cost" style={{ width: '100%' }} value={priceOverrides[material?.id] ?? null}
                    onChange={value => setPriceOverrides(previous => ({ ...previous, [material.id]: value }))} />
                </Form.Item></Col>
                <Col span={24}><Form.Item {...field} name={[name, 'instructions']} label="Preparation instruction (optional)"><Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} maxLength={255} /></Form.Item></Col>
              </Row>;
            })}
            <Form.ErrorList errors={errors} />
            {canEdit && <Button icon={<PlusOutlined />} onClick={() => add({ wastePercent: 0 })} style={{ marginBottom: 16 }}>Add ingredient</Button>}
          </>}
        </Form.List>
        </Card>
        <Card className="dark:bg-slate-800" title="Overheads & notes" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={12} md={6}><Form.Item name="laborCostPerBatch" label="Labour / batch (TZS)" rules={[{ required: true }]}><InputNumber min={0} max={9999999999.99} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item name="energyCostPerBatch" label="Energy / batch (TZS)" rules={[{ required: true }]}><InputNumber min={0} max={9999999999.99} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="additionalOverheadPerBatch" label="Additional overhead / batch (TZS)" extra="Enter only the amount you want included in this recipe. Use 0 if none." rules={[{ required: true }]}><InputNumber min={0} max={9999999999.99} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={24}><Form.Item name="description" label="Recipe notes"><Input.TextArea rows={2} maxLength={4000} /></Form.Item></Col>
        </Row>
        </Card>
        <Card className="dark:bg-slate-800" title="Live costing" style={{ marginBottom: 24 }}>
          <Typography.Paragraph>Ingredients + entered labour + energy + additional overhead. Purchases and expenses in Assets & Overheads are not added automatically.</Typography.Paragraph>
          {Object.values(priceOverrides).some(value => value != null) && <Alert type="info" title="Simulation active — saving uses inventory prices, not these temporary overrides." action={<Button onClick={() => setPriceOverrides({})}>Reset prices</Button>} style={{ marginBottom: 16 }} />}
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}><Statistic title="Ingredients (TZS)" value={ingredientCost} precision={2} /></Col>
            <Col xs={12} md={8}><Statistic title="Batch cost (TZS)" value={batchCost} precision={2} /></Col>
            <Col xs={24} md={8}><Statistic title="Cost per output unit (TZS)" value={unitCost} precision={2} /></Col>
          </Row>
          <Space wrap style={{ marginTop: 16 }}><label htmlFor="target-margin">Target margin (%)</label>
            <InputNumber id="target-margin" min={0} max={99} value={margin} onChange={setMargin} disabled={false} />
            <Typography.Text>Suggested price: TZS {money(unitCost / (1 - Number(margin || 0) / 100))}</Typography.Text>
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>Estimate using current material costs. Target margin is a simulation. Saving a recipe does not consume stock.</Typography.Paragraph>
        </Card>
        <Space wrap><Button onClick={() => navigate("/recipes")} disabled={saving}>Back to recipes</Button>{canEdit && <Button type="primary" htmlType="submit" loading={saving} disabled={!materials.length}>Save recipe (inventory prices)</Button>}</Space>
      </Form>

      </>}
      </div>
      </Spin>}
  </div>;
}
