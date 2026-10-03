import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, message } from 'antd';
import { fetchRawMaterials, fetchUnitsOfMeasure } from '../services/inventoryApi';
import Cookies from 'js-cookie';

const { Option } = Select;

// We need to add quickRefill to inventoryApi.js first, but we'll assume it exists or we use fetch directly
export default function QuickRefillModal({ open, onCancel, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [fetchingMaterials, setFetchingMaterials] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [uoms, setUoms] = useState([]);

  useEffect(() => {
    if (open) {
      setFetchingMaterials(true);
      Promise.all([
        fetchRawMaterials().then(setMaterials),
        fetchUnitsOfMeasure().then(setUoms)
      ]).catch(err => message.error('Failed to load data: ' + err.message))
        .finally(() => setFetchingMaterials(false));
    } else {
      form.resetFields();
      setSelectedMaterial(null);
    }
  }, [open, form]);

  const handleMaterialChange = (value) => {
    const material = materials.find(m => m.id === value);
    setSelectedMaterial(material);
    if (material) {
      form.setFieldsValue({ receivedUomId: material.baseUom?.id });
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedMaterial) {
        message.error("Please select a material");
        return;
      }
      setLoading(true);
      
      const payload = {
        lines: [
          {
            rawMaterialId: selectedMaterial.id,
            receivedUomId: values.receivedUomId || selectedMaterial.baseUom.id,
            purchaseQuantity: values.quantity,
            purchaseUnitCost: values.unitCost || (selectedMaterial.costPerBaseUnit || 0)
          }
        ],
        supplierName: values.supplierName || 'Walk-in Supplier',
        supplierReference: values.referenceNumber || 'N/A',
        notes: values.notes || ''
      };

      // Call facade API directly
      const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
      const res = await fetch('/api/inventory/goods-receipts/quick-refill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Refill failed');
      }

      message.success('Stock refilled successfully!');
      if (onSuccess) onSuccess();
      onCancel();
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Quick Refill"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Refill Stock"
      okButtonProps={{ style: { background: '#10B981', borderColor: '#10B981' } }}
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          name="materialId" 
          label="Raw Material" 
          rules={[{ required: true, message: 'Please select a material' }]}
        >
          <Select 
            showSearch 
            placeholder="Select a material..."
            loading={fetchingMaterials}
            onChange={handleMaterialChange}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {materials.map(m => (
              <Option key={m.id} value={m.id}>{m.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="quantity" 
          label="Quantity to Add"
          rules={[{ required: true, message: 'Please enter quantity' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0.001} step={0.01} />
        </Form.Item>

        <Form.Item 
          name="receivedUomId" 
          label="Unit of Measure"
          rules={[{ required: true, message: 'Please select unit' }]}
        >
          <Select 
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {uoms.map(u => (
              <Option key={u.id} value={u.id}>{u.name} {u.symbol ? `(${u.symbol})` : ''}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="unitCost" 
          label="Unit Cost (TZS) - Optional"
          extra={`Leave blank to use default cost (TZS ${selectedMaterial?.costPerBaseUnit || 0})`}
        >
          <InputNumber style={{ width: '100%' }} min={0} step={100} />
        </Form.Item>

        <Form.Item name="supplierName" label="Supplier (Optional)">
          <Input placeholder="e.g. Acme Supplies" />
        </Form.Item>

        <Form.Item name="notes" label="Notes (Optional)">
          <Input.TextArea rows={2} placeholder="Any details..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
