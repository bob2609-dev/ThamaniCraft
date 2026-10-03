import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, App, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Spin, Statistic, Typography, Table, Modal, Switch } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as api from '../services/recipeApi';
import { fetchRawMaterials, fetchUnitsOfMeasure } from '../services/inventoryApi';
import usePermissions from '../hooks/usePermissions';
import { withSorters } from '../utils/tableUtils';
import ImageUpload from '../components/ImageUpload';
import SearchableTable from '../components/SearchableTable';

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
  const routeId = id || 'new';

  const [items, setItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [ingredientForm] = Form.useForm();

  // Watch yield quantity and target margin to calculate unit cost and suggested price
  const yieldQuantity = Form.useWatch('yieldQuantity', form) || 1;
  const suggestedPrice = Form.useWatch('suggestedPrice', form) || 0;
  
  // Calculate costs
  const getLineCost = (item, mats = materials, uomsList = uoms) => {
    const material = mats.find(m => m.id === item.rawMaterialId);
    if (!material) return 0;
    
    // Simplistic cost calc - assuming cost is per base unit, and uomId is chosen. 
    // If a different UOM is chosen, we'd ideally multiply by conversion factor. 
    // The backend does this precisely, but we can do a rough estimate if uomId matches baseUom or we know the factor.
    // For simplicity in the UI simulation, we assume base unit or attempt to find conversion factor.
    const selectedUom = uomsList.find(u => u.id === item.uomId) || material.baseUom;
    const baseUom = material.baseUom;
    let factor = 1;
    if (selectedUom && selectedUom.id !== baseUom?.id) {
      // Find conversion relative to base if they share a baseUnit, or just assume 1 if unknown in UI
      if (selectedUom.baseUnit?.id === baseUom?.baseUnit?.id || selectedUom.baseUnit?.id === baseUom?.id) {
        factor = (selectedUom.conversionFactor || 1) / (baseUom?.conversionFactor || 1);
      }
    }
    
    return Number(item.quantityRequired) * factor * (material.costPerBaseUnit || 0);
  };

  const ingredientCost = items.reduce((sum, item) => sum + getLineCost(item), 0);
  const batchCost = ingredientCost; 
  const unitCost = Number(yieldQuantity) > 0 ? batchCost / Number(yieldQuantity) : 0;
  const marginPercentage = (suggestedPrice > 0 && unitCost >= 0) 
    ? (((suggestedPrice - unitCost) / suggestedPrice) * 100)
    : 0;

  useEffect(() => {
    if (!canView || (!id && !canEdit)) return;
    let active = true;
    Promise.all([fetchRawMaterials(), fetchUnitsOfMeasure(), id ? api.getRecipe(id) : Promise.resolve(null)])
      .then(([currentMaterials, units, recipe]) => {
        if (!active) return;
        setMaterials(currentMaterials);
        setUoms(units);
        form.resetFields();
        if (recipe) {
          const rItems = recipe.items || [];
          const currentBatchCost = rItems.reduce((sum, item) => sum + getLineCost(item, currentMaterials, units), 0);
          const currentUnitCost = recipe.yieldQuantity > 0 ? currentBatchCost / recipe.yieldQuantity : 0;
          const currentSuggestedPrice = recipe.suggestedPrice || 0;

          form.setFieldsValue({
            name: recipe.name,
            description: recipe.description,
            yieldQuantity: recipe.yieldQuantity,
            yieldUomId: recipe.yieldUomId,
            suggestedPrice: currentSuggestedPrice,
            productionMode: recipe.productionMode || 'BATCH_PRE_MADE'
          });
          setItems(rItems);
        } else {
          form.setFieldsValue({ 
            yieldQuantity: 1, 
            suggestedPrice: 0,
            productionMode: 'BATCH_PRE_MADE'
          });
          setItems([]);
        }
        setError('');
        setLoadedId(routeId);
      }).catch((failure) => { if (active) { setError(failure.message); setLoadedId(routeId); } });
    return () => { active = false; };
  }, [id, routeId, canView, canEdit, form]);

  async function save() {
    if (saving) return;
    try {
      const data = await form.validateFields();
      if (items.length === 0) {
        message.error("Please add at least one ingredient");
        return;
      }
      setSaving(true);
      const payload = {
        ...data,
        suggestedPrice: Number(data.suggestedPrice || 0),
        laborCostPerBatch: 0,
        energyCostPerBatch: 0,
        additionalOverheadPerBatch: 0,
        items: items.map(item => ({
          ...item,
          wasteFactor: 0
        }))
      };
      
      await api.saveRecipe(id, payload);
      message.success('Recipe saved');
      navigate('/recipes');
    } catch (failure) { 
      if (failure.errorFields) return; // Validation error
      message.error(failure.message); 
    } finally { 
      setSaving(false); 
    }
  }

  const openIngredientModal = (index = -1) => {
    setEditingIndex(index);
    if (index >= 0) {
      ingredientForm.setFieldsValue(items[index]);
    } else {
      ingredientForm.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleIngredientOk = async () => {
    try {
      const values = await ingredientForm.validateFields();
      const newItems = [...items];
      if (editingIndex >= 0) {
        newItems[editingIndex] = values;
      } else {
        newItems.push(values);
      }
      setItems(newItems);
      setIsModalVisible(false);
    } catch (e) {
      // Validation failed
    }
  };

  const handleIngredientRemove = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const columns = [
    {
      title: 'Ingredient',
      dataIndex: 'rawMaterialId',
      render: (val) => {
        const mat = materials.find(m => m.id === val);
        return mat ? mat.name : 'Unknown';
      }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantityRequired',
      render: (val, record) => {
        const uom = uoms.find(u => u.id === record.uomId);
        const mat = materials.find(m => m.id === record.rawMaterialId);
        const unitSymbol = uom?.symbol || mat?.baseUom?.symbol || '';
        return `${val} ${unitSymbol}`;
      }
    },
    {
      title: 'Line Cost (Est)',
      key: 'cost',
      render: (_, record) => `TZS ${money(getLineCost(record))}`
    },
    {
      title: 'Instructions',
      dataIndex: 'instructions',
      ellipsis: true
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record, index) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openIngredientModal(index)} disabled={!canEdit} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleIngredientRemove(index)} disabled={!canEdit} />
        </Space>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow" style={{ width: '100%', minWidth: 0, animation: "fadeIn 0.5s ease-out" }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/recipes')} disabled={saving} style={{ marginBottom: 16 }}>Back to recipes</Button>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={2} style={{ marginTop: 0 }}>{id ? (canEdit ? 'Edit recipe' : 'View recipe') : 'New recipe'}</Typography.Title>
        <Space>
          <Button onClick={() => navigate("/recipes")} disabled={saving}>Cancel</Button>
          {canEdit && <Button type="primary" onClick={save} loading={saving}>Save Recipe</Button>}
        </Space>
      </div>

      {!canView || (!id && !canEdit) ? <Alert type="warning" showIcon message="You do not have permission to open this recipe page." />
        : <Spin spinning={loadedId !== routeId}>
        <div style={{ display: loadedId === routeId ? 'block' : 'none', minHeight: 120 }}>
        {error ? <Alert type="error" showIcon message="Could not load recipe" description={error} /> : <>
        
        <Form form={form} layout="vertical" disabled={!canEdit || saving}>
          {!materials.length && <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Create raw materials in Inventory before adding recipe ingredients." />}
          
          <Row gutter={24}>
            {/* Left Column: Recipe Details & Costing */}
            <Col xs={24} lg={8}>
              <Card className="glass-panel" style={{ borderRadius: 12, marginBottom: 24 }}>
                <Typography.Title level={4}>Recipe Details</Typography.Title>
                
                <Form.Item name="name" label="Recipe name" rules={[{ required: true, whitespace: true }]}>
                  <Input maxLength={255} />
                </Form.Item>
                
                <Form.Item name="productionMode" label="Production Mode" rules={[{ required: true }]}>
                  <Select options={[
                    { value: 'BATCH_PRE_MADE', label: 'Pre-Made (Batch)' },
                    { value: 'JUST_IN_TIME', label: 'Made-on-Demand (JIT)' }
                  ]} />
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name="yieldQuantity" label="Batch Yield" rules={[{ required: true }]}>
                      <InputNumber min={0.01} precision={2} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="yieldUomId" label="Output Unit" rules={[{ required: true }]}>
                      <Select options={uoms.map((unit) => ({ value: unit.id, label: unit.symbol || unit.name }))} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="description" label="Notes (Optional)">
                  <Input.TextArea rows={2} maxLength={4000} />
                </Form.Item>

                <Form.Item name="imageUrl" label="Product Image (Optional)">
                  <ImageUpload />
                </Form.Item>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                  <Typography.Title level={5}>Pricing Details</Typography.Title>
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <Statistic title="Est. Batch Cost" value={batchCost} precision={2} prefix="TZS" valueStyle={{ fontSize: 18 }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Est. Unit Cost" value={unitCost} precision={2} prefix="TZS" valueStyle={{ fontSize: 18 }} />
                    </Col>
                  </Row>
                  
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="suggestedPrice" label="Suggested Price (TZS)">
                        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="Auto-Calculated Margin" 
                        value={marginPercentage} 
                        precision={2} 
                        suffix="%" 
                        valueStyle={{ 
                          fontSize: 18, 
                          color: marginPercentage > 30 ? '#3f8600' : marginPercentage > 0 ? '#faad14' : '#cf1322' 
                        }} 
                      />
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>

            {/* Right Column: Ingredients Table */}
            <Col xs={24} lg={16}>
              <Card 
                className="glass-panel" 
                style={{ borderRadius: 12, height: '100%' }}
                title="Ingredients"
                extra={canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => openIngredientModal(-1)}>Add Ingredient</Button>}
              >
                <SearchableTable 
                  columns={withSorters(columns)}
                  dataSource={items}
                  rowKey={(record, i) => i}
                  pagination={false}
                />
                
                {items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                    <p>No ingredients added yet.</p>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Form>
        
        {/* Add/Edit Ingredient Modal */}
        <Modal
          title={editingIndex >= 0 ? "Edit Ingredient" : "Add Ingredient"}
          open={isModalVisible}
          onOk={handleIngredientOk}
          onCancel={() => setIsModalVisible(false)}
          okText="Save to Recipe"
        >
          <Form form={ingredientForm} layout="vertical">
            <Form.Item name="rawMaterialId" label="Ingredient" rules={[{ required: true, message: 'Select an ingredient' }]}>
              <Select 
                showSearch 
                optionFilterProp="label" 
                options={materials.map(m => ({ value: m.id, label: `${m.name} (${m.sku || m.baseUom?.symbol})` }))} 
                onChange={(val) => {
                  // auto-select base unit
                  const mat = materials.find(m => m.id === val);
                  if (mat) ingredientForm.setFieldValue('uomId', mat.baseUom?.id);
                }}
              />
            </Form.Item>
            
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="quantityRequired" label="Quantity" rules={[{ required: true, message: 'Enter quantity' }]}>
                  <InputNumber min={0.0001} precision={4} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="uomId" label="Unit of Measure" rules={[{ required: true, message: 'Select unit' }]}>
                  <Select 
                    showSearch
                    optionFilterProp="label"
                    options={uoms.map(u => ({ value: u.id, label: u.name + (u.symbol ? ` (${u.symbol})` : '') }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="instructions" label="Preparation Instructions (Optional)">
              <Input.TextArea rows={2} maxLength={255} />
            </Form.Item>
          </Form>
        </Modal>

        </>}
        </div>
        </Spin>}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ant-card.glass-panel {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
