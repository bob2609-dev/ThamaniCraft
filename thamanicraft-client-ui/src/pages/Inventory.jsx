import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Modal, Form, Input, Select, InputNumber, message, Space, Popconfirm, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import * as api from '../services/inventoryApi';
import usePermissions from '../hooks/usePermissions';
import CostCorrectionModal from '../components/CostCorrectionModal';
import QuickRefillModal from '../components/QuickRefillModal';
import { withSorters } from '../utils/tableUtils';
import ImageUpload from '../components/ImageUpload';
import SearchableTable from '../components/SearchableTable';



export default function Inventory() {
  const { hasPermission } = usePermissions();
  const [costMaterial, setCostMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState('rawMaterials');
  const [refillVisible, setRefillVisible] = useState(false);
  
  // State for Raw Materials
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loadingRawMaterials, setLoadingRawMaterials] = useState(false);
  const [isRawMaterialModalVisible, setIsRawMaterialModalVisible] = useState(false);
  const [editingRawMaterial, setEditingRawMaterial] = useState(null);
  const [rawMaterialForm] = Form.useForm();
  const selectedBaseUomId = Form.useWatch('baseUomId', rawMaterialForm);

  // State for Finished Products
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [loadingFinishedProducts, setLoadingFinishedProducts] = useState(false);
  const [isFinishedProductModalVisible, setIsFinishedProductModalVisible] = useState(false);
  const [editingFinishedProduct, setEditingFinishedProduct] = useState(null);
  const [finishedProductForm] = Form.useForm();
  const selectedFpBaseUomId = Form.useWatch('baseUomId', finishedProductForm);

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
    } else if (activeTab === 'finishedProducts') {
      loadFinishedProducts();
      loadUoms(); // Need UOMs for dropdowns
      loadCategories(); // Need Categories for dropdown
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

  // Finished Product Functions
  const loadFinishedProducts = async () => {
    setLoadingFinishedProducts(true);
    try {
      const data = await api.fetchFinishedProducts();
      setFinishedProducts(data);
    } catch (error) {
      message.error('Failed to load Finished Products');
    } finally {
      setLoadingFinishedProducts(false);
    }
  };

  const handleAddFinishedProduct = () => {
    setEditingFinishedProduct(null);
    finishedProductForm.resetFields();
    setIsFinishedProductModalVisible(true);
  };

  const selectedFpBaseUom = uoms.find((uom) => uom.id === selectedFpBaseUomId);
  const fpBaseUnitLabel = selectedFpBaseUom?.symbol || 'base UOM';

  const handleEditFinishedProduct = (record) => {
    setEditingFinishedProduct(record);
    finishedProductForm.setFieldsValue({
      ...record,
      baseUomId: record.baseUom?.id,
    });
    setIsFinishedProductModalVisible(true);
  };

  const handleDeleteFinishedProduct = async (id) => {
    try {
      await api.deleteFinishedProduct(id);
      message.success('Finished Product deleted');
      loadFinishedProducts();
    } catch (error) {
      message.error('Failed to delete Finished Product');
    }
  };

  const handleFinishedProductModalOk = async () => {
    try {
      const values = await finishedProductForm.validateFields();
      const payload = {
        ...values,
        baseUom: { id: values.baseUomId }
      };

      if (editingFinishedProduct) {
        await api.updateFinishedProduct(editingFinishedProduct.id, payload);
        message.success('Finished Product updated');
      } else {
        await api.createFinishedProduct(payload);
        message.success('Finished Product created');
      }
      setIsFinishedProductModalVisible(false);
      loadFinishedProducts();
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
      render: (_, record) => {
        const isGlobal = !record.tenantId;
        return (
          <Space size="middle">
            <Button icon={<EditOutlined />} onClick={() => handleEditUom(record)} disabled={isGlobal} title={isGlobal ? "Global units cannot be edited" : ""} />
            {isGlobal ? (
              <Button danger icon={<DeleteOutlined />} disabled title="Global units cannot be deleted" />
            ) : (
              <Popconfirm title="Sure to delete?" onConfirm={() => handleDeleteUom(record.id)}>
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
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
      render: (value, record) => {
        const qty = Number(value ?? 0);
        const reorderLevel = Number(record.reorderLevelBaseQty ?? 0);
        const formatted = formatBaseQuantity(value, record);
        
        if (qty <= reorderLevel) {
          return <span className="text-red-500 font-bold">{formatted} (Low)</span>;
        }
        return formatted;
      },
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

  const finishedProductColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', responsive: ['md'] },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category', responsive: ['lg'] },
    { title: 'Base UOM', dataIndex: ['baseUom', 'name'], key: 'baseUom', responsive: ['md'] },
    {
      title: 'Current Stock (Base UOM)',
      dataIndex: 'currentStockBaseQty',
      key: 'currentStock',
      render: (value, record) => formatBaseQuantity(value, record),
    },
    { title: 'Unit cost (TZS)', dataIndex: 'costPerBaseUnit', key: 'cost',
      render: (value, record) => `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 })} / ${record.baseUom?.symbol || 'unit'}` },
    { title: 'Selling Price (TZS)', dataIndex: 'sellingPrice', key: 'sellingPrice',
      render: (value, record) => `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} / ${record.baseUom?.symbol || 'unit'}` },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEditFinishedProduct(record)} />
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDeleteFinishedProduct(record.id)}>
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
          onClick={activeTab === 'rawMaterials' ? handleAddRawMaterial : activeTab === 'finishedProducts' ? handleAddFinishedProduct : activeTab === 'uom' ? handleAddUom : handleAddCategory}
        >
          Add {activeTab === 'rawMaterials' ? 'Material' : activeTab === 'finishedProducts' ? 'Finished Product' : activeTab === 'uom' ? 'Unit' : 'Category'}
        </Button>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'rawMaterials',
            label: 'Raw Materials',
            children: (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<ThunderboltOutlined />} 
                    onClick={() => setRefillVisible(true)}
                    style={{ background: '#10B981', borderColor: '#10B981' }}
                  >
                    Quick Refill
                  </Button>
                </div>
                <SearchableTable 
                  columns={withSorters(rawMaterialColumns)} 
                  dataSource={rawMaterials} 
                  rowKey="id" 
                  loading={loadingRawMaterials} 
                  scroll={{ x: 'max-content' }}
                />
              </div>
            ),
          },
          {
            key: 'finishedProducts',
            label: 'Finished Products',
            children: (
              <SearchableTable 
                columns={withSorters(finishedProductColumns)} 
                dataSource={finishedProducts} 
                rowKey="id" 
                loading={loadingFinishedProducts} 
                scroll={{ x: 'max-content' }}
              />
            ),
          },
          {
            key: 'categories',
            label: 'Categories',
            children: (
              <SearchableTable 
                columns={withSorters(categoryColumns)} 
                dataSource={categories} 
                rowKey="id" 
                loading={loadingCategories} 
                scroll={{ x: 'max-content' }}
              />
            ),
          },
          {
            key: 'uom',
            label: 'Units of Measure',
            children: (
              <SearchableTable 
                columns={withSorters(uomColumns)} 
                dataSource={uoms} 
                rowKey="id" 
                loading={loadingUoms} 
                scroll={{ x: 'max-content' }}
              />
            ),
          }
        ]}
      />

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
                <Select 
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                >
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
                <Select 
                  disabled={Boolean(editingRawMaterial && Number(editingRawMaterial.currentStockBaseQty) > 0)}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                >
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

      {/* Finished Product Modal */}
      <Modal
        title={editingFinishedProduct ? 'Edit Finished Product' : 'Add Finished Product'}
        open={isFinishedProductModalVisible}
        onOk={handleFinishedProductModalOk}
        onCancel={() => setIsFinishedProductModalVisible(false)}
        width={900}
      >
        <Form form={finishedProductForm} layout="vertical">
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
              <Form.Item name="category" label="Category">
                <Select allowClear showSearch placeholder="Select category" optionFilterProp="label"
                  options={categories.map(c => ({ value: c.name, label: c.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="baseUomId"
                label="Base UOM (inventory unit)"
                rules={[{ required: true }]}
              >
                <Select 
                  disabled={Boolean(editingFinishedProduct && Number(editingFinishedProduct.currentStockBaseQty) > 0)}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                >
                  {uoms.map(u => <Option key={u.id} value={u.id}>{u.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="currentStockBaseQty"
                label={editingFinishedProduct ? `Current Stock (${fpBaseUnitLabel})` : `Opening Stock (${fpBaseUnitLabel})`}
                rules={[{ required: false }]}
                extra={editingFinishedProduct ? 'Read-only here. Alter via production or adjustment.' : 'Enter starting stock if available.'}
              >
                <InputNumber className="w-full" min={0} disabled={Boolean(editingFinishedProduct)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="costPerBaseUnit"
                label={`Cost per ${fpBaseUnitLabel} (TZS)`}
                rules={[{ required: false }]}
                extra="Average cost per unit."
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="sellingPrice"
                label={`Selling Price (TZS)`}
                rules={[{ required: true }]}
                extra="Default price applied in sales."
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="imageUrl"
                label="Product Image"
                rules={[{ required: false }]}
                extra="Upload an image for the point of sale."
              >
                <ImageUpload />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <QuickRefillModal 
        open={refillVisible} 
        onCancel={() => setRefillVisible(false)} 
        onSuccess={loadRawMaterials} 
      />
    </div>
  );
}
