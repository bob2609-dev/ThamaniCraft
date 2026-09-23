import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Modal, Form, Input, Select, InputNumber, message, Space, Popconfirm, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import * as api from '../services/inventoryApi';
import usePermissions from '../hooks/usePermissions';
import CostCorrectionModal from '../components/CostCorrectionModal';

const { TabPane } = Tabs;

export default function Inventory() {
  const { hasPermission } = usePermissions();
  const [costMaterial, setCostMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState('rawMaterials');
  
  // State for Raw Materials
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loadingRawMaterials, setLoadingRawMaterials] = useState(false);
  const [isRawMaterialModalVisible, setIsRawMaterialModalVisible] = useState(false);
  const [editingRawMaterial, setEditingRawMaterial] = useState(null);
  const [rawMaterialForm] = Form.useForm();
  const selectedBaseUomId = Form.useWatch('baseUomId', rawMaterialForm);

  // State for UOM
  const [uoms, setUoms] = useState([]);
  const [loadingUoms, setLoadingUoms] = useState(false);
  const [isUomModalVisible, setIsUomModalVisible] = useState(false);
  const [editingUom, setEditingUom] = useState(null);
  const [uomForm] = Form.useForm();

  // State for Categories
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm] = Form.useForm();

  useEffect(() => {
    if (activeTab === 'rawMaterials') {
      loadRawMaterials();
      loadUoms(); // Need UOMs for dropdowns
      loadCategories(); // Need Categories for dropdowns
    } else if (activeTab === 'uom') {
      loadUoms();
    } else if (activeTab === 'categories') {
      loadCategories();
    }
  }, [activeTab]);

  // UOM Functions
  const loadUoms = async () => {
    setLoadingUoms(true);
    try {
      const data = await api.fetchUnitsOfMeasure();
      setUoms(data);
    } catch (error) {
      message.error('Failed to load Units of Measure');
    } finally {
      setLoadingUoms(false);
    }
  };

  const handleAddUom = () => {
    setEditingUom(null);
    uomForm.resetFields();
    setIsUomModalVisible(true);
  };

  const handleEditUom = (record) => {
    setEditingUom(record);
    uomForm.setFieldsValue({
      ...record,
      baseUnitId: record.baseUnit?.id,
    });
    setIsUomModalVisible(true);
  };

  const handleDeleteUom = async (id) => {
    try {
      await api.deleteUnitOfMeasure(id);
      message.success('Unit of Measure deleted');
      loadUoms();
    } catch (error) {
      message.error('Failed to delete Unit of Measure');
    }
  };

  const handleUomModalOk = async () => {
    try {
      const values = await uomForm.validateFields();
      const payload = {
        ...values,
        baseUnit: values.baseUnitId ? { id: values.baseUnitId } : null,
      };

      if (editingUom) {
        await api.updateUnitOfMeasure(editingUom.id, payload);
        message.success('Unit of Measure updated');
      } else {
        await api.createUnitOfMeasure(payload);
        message.success('Unit of Measure created');
      }
      setIsUomModalVisible(false);
      loadUoms();
    } catch (error) {
      console.error(error);
      message.error(error.message || 'Operation failed');
    }
  };

  // Category Functions
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await api.fetchCategories();
      setCategories(data);
    } catch (error) {
      message.error('Failed to load Categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.resetFields();
    setIsCategoryModalVisible(true);
  };

  const handleEditCategory = (record) => {
    setEditingCategory(record);
    categoryForm.setFieldsValue({
      ...record,
    });
    setIsCategoryModalVisible(true);
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.deleteCategory(id);
      message.success('Category deleted');
      loadCategories();
    } catch (error) {
      message.error('Failed to delete Category');
    }
  };

  const handleCategoryModalOk = async () => {
    try {
      const values = await categoryForm.validateFields();
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, values);
        message.success('Category updated');
      } else {
        await api.createCategory(values);
        message.success('Category created');
      }
      setIsCategoryModalVisible(false);
      loadCategories();
    } catch (error) {
      console.error(error);
      message.error('Operation failed');
    }
  };

  // Raw Material Functions
  const loadRawMaterials = async () => {
    setLoadingRawMaterials(true);
    try {
      const data = await api.fetchRawMaterials();
      setRawMaterials(data);
    } catch (error) {
      message.error('Failed to load Raw Materials');
    } finally {
      setLoadingRawMaterials(false);
    }
  };

  const handleAddRawMaterial = () => {
    setEditingRawMaterial(null);
    rawMaterialForm.resetFields();
    setIsRawMaterialModalVisible(true);
  };

  const selectedBaseUom = uoms.find((uom) => uom.id === selectedBaseUomId);
  const baseUnitLabel = selectedBaseUom?.symbol || 'base UOM';
  const formatBaseQuantity = (value, material) => {
    const quantity = Number(value ?? 0);
    const formatted = Number.isFinite(quantity)
      ? quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })
      : '0';
    return `${formatted} ${material.baseUom?.symbol || ''}`.trim();
  };

  const handleEditRawMaterial = (record) => {
    setEditingRawMaterial(record);
    rawMaterialForm.setFieldsValue({
      ...record,
      baseUomId: record.baseUom?.id,
      purchaseUomId: record.purchaseUom?.id,
      categoryId: record.category?.id,
    });
    setIsRawMaterialModalVisible(true);
  };

  const handleDeleteRawMaterial = async (id) => {
    try {
      await api.deleteRawMaterial(id);
      message.success('Raw Material deleted');
      loadRawMaterials();
    } catch (error) {
      message.error('Failed to delete Raw Material');
    }
  };

  const handleRawMaterialModalOk = async () => {
    try {
      const values = await rawMaterialForm.validateFields();
      const payload = {
        ...values,
        baseUom: { id: values.baseUomId },
        purchaseUom: { id: values.purchaseUomId },
        category: values.categoryId ? { id: values.categoryId } : null,
      };

      if (editingRawMaterial) {
        await api.updateRawMaterial(editingRawMaterial.id, payload);
        message.success('Raw Material updated');
      } else {
        await api.createRawMaterial(payload);
        message.success('Raw Material created');
      }
      setIsRawMaterialModalVisible(false);
      loadRawMaterials();
    } catch (error) {
      console.error(error);
      message.error(error.message || 'Operation failed');
    }
  };

  // Table Columns
  const uomColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
    { title: 'Category', dataIndex: 'category', key: 'category', responsive: ['md'] },
    { title: 'Base Unit', dataIndex: ['baseUnit', 'name'], key: 'baseUnit', responsive: ['lg'] },
    { title: 'Conversion Factor', dataIndex: 'conversionFactor', key: 'conversionFactor', responsive: ['lg'] },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEditUom(record)} />
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDeleteUom(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rawMaterialColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', responsive: ['md'] },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Unit cost (TZS)', dataIndex: 'costPerBaseUnit', key: 'cost',
      render: (value, record) => `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 })} / ${record.baseUom?.symbol || 'unit'}` },
    { title: 'Category', dataIndex: ['category', 'name'], key: 'category', responsive: ['lg'] },
    { title: 'Base UOM', dataIndex: ['baseUom', 'name'], key: 'baseUom', responsive: ['md'] },
    {
      title: 'Current Stock (Base UOM)',
      dataIndex: 'currentStockBaseQty',
      key: 'currentStock',
      render: (value, record) => formatBaseQuantity(value, record),
    },
    {
      title: 'Reorder Level (Base UOM)',
      dataIndex: 'reorderLevelBaseQty',
      key: 'reorderLevel',
      responsive: ['lg'],
      render: (value, record) => formatBaseQuantity(value, record),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEditRawMaterial(record)} />
          {hasPermission('ADJUST_INVENTORY') && <Button onClick={() => setCostMaterial(record)}>Edit cost</Button>}
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDeleteRawMaterial(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const categoryColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', responsive: ['md'] },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEditCategory(record)} />
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDeleteCategory(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={activeTab === 'rawMaterials' ? handleAddRawMaterial : activeTab === 'uom' ? handleAddUom : handleAddCategory}
        >
          Add {activeTab === 'rawMaterials' ? 'Material' : activeTab === 'uom' ? 'Unit' : 'Category'}
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Raw Materials" key="rawMaterials">
          <Table 
            columns={rawMaterialColumns} 
            dataSource={rawMaterials} 
            rowKey="id" 
            loading={loadingRawMaterials} 
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
        <TabPane tab="Categories" key="categories">
          <Table 
            columns={categoryColumns} 
            dataSource={categories} 
            rowKey="id" 
            loading={loadingCategories} 
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
        <TabPane tab="Units of Measure" key="uom">
          <Table 
            columns={uomColumns} 
            dataSource={uoms} 
            rowKey="id" 
            loading={loadingUoms} 
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
      </Tabs>

      {/* Category Modal */}
      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={isCategoryModalVisible}
        onOk={handleCategoryModalOk}
        onCancel={() => setIsCategoryModalVisible(false)}
        width={600}
      >
        <Form form={categoryForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* UOM Modal */}
      <Modal
        title={editingUom ? 'Edit Unit of Measure' : 'Add Unit of Measure'}
        open={isUomModalVisible}
        onOk={handleUomModalOk}
        onCancel={() => setIsUomModalVisible(false)}
        width={700}
      >
        <Form form={uomForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="symbol" label="Symbol" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select>
                  <Option value="Weight">Weight</Option>
                  <Option value="Volume">Volume</Option>
                  <Option value="Length">Length</Option>
                  <Option value="Count">Count</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="baseUnitId" label="Base Unit (Optional)">
                <Select allowClear>
                  {uoms.map(u => <Option key={u.id} value={u.id}>{u.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="conversionFactor" label="Conversion Factor">
                <InputNumber className="w-full" min={0} step={0.000001} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Raw Material Modal */}
      {costMaterial && <CostCorrectionModal key={costMaterial.id} material={costMaterial} onClose={() => setCostMaterial(null)} onSaved={(updated) => {
        if (editingRawMaterial?.id === updated.id) {
          setEditingRawMaterial(updated);
          rawMaterialForm.setFieldValue('costPerBaseUnit', updated.costPerBaseUnit);
        }
        loadRawMaterials();
      }} />}
      <Modal
        title={editingRawMaterial ? 'Edit Raw Material' : 'Add Raw Material'}
        open={isRawMaterialModalVisible && !costMaterial}
        onOk={handleRawMaterialModalOk}
        onCancel={() => setIsRawMaterialModalVisible(false)}
        width={900}
      >
        <Form form={rawMaterialForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="sku" label="SKU">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="categoryId" label="Category">
                <Select allowClear>
                  {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="baseUomId"
                label="Base UOM (consumption unit)"
                rules={[{ required: true }]}
                extra={selectedBaseUom?.baseUnit
                  ? `Recipe quantities will be in ${selectedBaseUom.name}. To use individual ${selectedBaseUom.baseUnit.name} units, select ${selectedBaseUom.baseUnit.name} as the Base UOM and keep ${selectedBaseUom.name} as the Purchase UOM.`
                  : 'Choose the unit used in recipes: Piece for eggs, Gram for flour. Trays and bags belong in Purchase UOM.'}
              >
                <Select disabled={Boolean(editingRawMaterial && Number(editingRawMaterial.currentStockBaseQty) > 0)}>
                  {uoms.map(u => <Option key={u.id} value={u.id}>{u.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="purchaseUomId" label="Purchase UOM" rules={[{ required: true }]}>
                <Select>
                  {uoms.map(u => <Option key={u.id} value={u.id}>{u.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="storageLocation" label="Storage Location">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="currentStockBaseQty"
                label={editingRawMaterial ? `Current Stock (${baseUnitLabel})` : `Opening Stock (${baseUnitLabel})`}
                rules={[{ required: true }]}
                extra={editingRawMaterial ? 'Use Goods Receipts or a stock adjustment to change this balance.' : 'Enter this quantity in the selected base UOM.'}
              >
                <InputNumber className="w-full" min={0} disabled={Boolean(editingRawMaterial)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="costPerBaseUnit"
                label={`Cost per ${baseUnitLabel} (TZS)`}
                rules={[{ required: true }]}
                extra={editingRawMaterial
                  ? hasPermission('ADJUST_INVENTORY')
                    ? <Button type="link" style={{ padding: 0 }} onClick={() => setCostMaterial(editingRawMaterial)}>Edit cost — enter a correction</Button>
                    : 'Inventory adjustment permission is required to correct this cost.'
                  : 'Enter the opening valuation per base unit.'}
              >
                <InputNumber className="w-full" min={0} disabled={Boolean(editingRawMaterial)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="reorderLevelBaseQty" label={`Reorder Level (${baseUnitLabel})`} rules={[{ required: true }]}>
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
