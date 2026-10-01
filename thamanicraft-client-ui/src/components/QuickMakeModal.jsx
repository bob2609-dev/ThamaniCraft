import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, message } from 'antd';
import { productionRecipes, quickMake } from '../services/productionApi';

const { Option } = Select;

export default function QuickMakeModal({ open, onCancel, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [fetchingRecipes, setFetchingRecipes] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    if (open) {
      setFetchingRecipes(true);
      productionRecipes()
        .then(data => setRecipes(data))
        .catch(err => message.error('Failed to load recipes: ' + err.message))
        .finally(() => setFetchingRecipes(false));
    } else {
      form.resetFields();
      setSelectedRecipe(null);
    }
  }, [open, form]);

  const handleRecipeChange = (value) => {
    const recipe = recipes.find(r => r.id === value);
    setSelectedRecipe(recipe);
    if (recipe) {
      form.setFieldsValue({ plannedYield: recipe.yieldQuantity });
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedRecipe) {
        message.error("Please select a recipe");
        return;
      }
      setLoading(true);
      
      const payload = {
        recipeId: selectedRecipe.id,
        plannedYield: values.plannedYield,
        reference: values.reference || '',
        notes: values.notes || '',
        version: 0
      };

      await quickMake(payload);
      
      message.success('Production completed successfully!');
      if (onSuccess) onSuccess();
      onCancel();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || 'Production failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Quick Make (Production)"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Produce"
      okButtonProps={{ style: { background: '#F59E0B', borderColor: '#F59E0B' } }}
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          name="recipeId" 
          label="Recipe" 
          rules={[{ required: true, message: 'Please select a recipe' }]}
        >
          <Select 
            showSearch 
            placeholder="Select a recipe..."
            loading={fetchingRecipes}
            onChange={handleRecipeChange}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {recipes.map(r => (
              <Option key={r.id} value={r.id}>{r.name} {r.yieldUomSymbol ? `(${r.yieldUomSymbol})` : ''}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="plannedYield" 
          label={`Quantity to Produce ${selectedRecipe ? '(' + (selectedRecipe.yieldUomSymbol || '') + ')' : ''}`}
          rules={[{ required: true, message: 'Please enter quantity' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0.01} step={1} />
        </Form.Item>

        <Form.Item name="reference" label="Batch Reference (Optional)">
          <Input placeholder="e.g. BATCH-001" />
        </Form.Item>

        <Form.Item name="notes" label="Notes (Optional)">
          <Input.TextArea rows={2} placeholder="Any details..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
