import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Table, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import * as api from '../services/inventoryApi';
import { withSorters } from '../utils/tableUtils';
import SearchableTable from '../components/SearchableTable';

const { Title, Text } = Typography;

export default function Procurement() {
  const [form] = Form.useForm();
  const [materials, setMaterials] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const findMaterial = (id) => materials.find((material) => material.id === id);
  const lineUoms = (material) => [material?.baseUom, material?.purchaseUom]
    .filter(Boolean)
    .filter((uom, index, all) => all.findIndex((candidate) => candidate.id === uom.id) === index);
  const load = () => { api.fetchRawMaterials().then(setMaterials); api.fetchGoodsReceipts().then(setReceipts).catch(() => message.error('Failed to load receipt history')); };
  useEffect(load, []);
  const submit = async (values) => { setSaving(true); try { await api.createGoodsReceipt({ ...values, lines: values.lines.map((line) => ({ ...line, purchaseQuantity: Number(line.purchaseQuantity), purchaseUnitCost: Number(line.purchaseUnitCost) })) }); message.success('Goods received'); setOpen(false); load(); } catch { message.error('Could not post receipt'); } finally { setSaving(false); } };
  const showModal = () => { form.resetFields(); form.setFieldsValue({ lines: [{}] }); setOpen(true); };

  return <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
    <div className="flex justify-between items-center mb-4"><div><Title level={2} className="!mb-0">Goods Receipts</Title><Text>Supplier deliveries and inventory valuation.</Text></div><Button type="primary" icon={<PlusOutlined />} onClick={showModal}>Receive goods</Button></div>
    <Card className="dark:bg-slate-800"><SearchableTable rowKey="id" dataSource={receipts} scroll={{ x: 1000 }} columns={withSorters([{ title: 'Received', dataIndex: 'receivedAt', render: (value) => value && new Date(value).toLocaleString() }, { title: 'Supplier', dataIndex: 'supplierName' }, { title: 'Reference', dataIndex: 'supplierReference' }, { title: 'Materials', dataIndex: 'materials' }, { title: 'Lines', dataIndex: 'lineCount', align: 'right' }, { title: 'Received quantity', dataIndex: 'receivedQuantities', align: 'right' }, { title: 'Base quantity', dataIndex: 'baseQuantities', align: 'right' }, { title: 'Total cost (TZS)', dataIndex: 'totalCost', align: 'right', render: (value) => Number(value).toLocaleString() }, { title: 'Received by', dataIndex: 'receivedBy' }])} /></Card>
    <Modal title="Receive goods" open={open} onCancel={() => setOpen(false)} footer={null} width={900}><Form form={form} layout="vertical" onFinish={submit}>
      <Row gutter={16}><Col xs={24} md={12}><Form.Item name="supplierName" label="Supplier"><Input /></Form.Item></Col><Col xs={24} md={12}><Form.Item name="supplierReference" label="GRN / Invoice"><Input /></Form.Item></Col></Row>
      <Form.List name="lines">{(fields, { add, remove }) => <>{fields.map(({ key, ...field }) => <Row key={key} gutter={12} align="bottom"><Col xs={24} md={9}><Form.Item {...field} name={[field.name, 'rawMaterialId']} label="Material" rules={[{ required: true }]}><Select onChange={(materialId) => form.setFieldValue(['lines', field.name, 'receivedUomId'], findMaterial(materialId)?.purchaseUom?.id || findMaterial(materialId)?.baseUom?.id)} options={materials.map((m) => ({ value: m.id, label: `${m.name} (${m.purchaseUom?.symbol || m.baseUom?.symbol || ''})` }))} /></Form.Item></Col><Form.Item noStyle shouldUpdate={(previous, current) => previous.lines?.[field.name]?.rawMaterialId !== current.lines?.[field.name]?.rawMaterialId}>{({ getFieldValue }) => { const material = findMaterial(getFieldValue(['lines', field.name, 'rawMaterialId'])); return <Col xs={12} md={4}><Form.Item {...field} name={[field.name, 'receivedUomId']} label="Received UOM" rules={[{ required: true }]}><Select disabled={!material} options={lineUoms(material).map((uom) => ({ value: uom.id, label: `${uom.name} (${uom.symbol})` }))} /></Form.Item></Col>; }}</Form.Item><Col xs={12} md={3}><Form.Item {...field} name={[field.name, 'purchaseQuantity']} label="Received qty" rules={[{ required: true }]}><InputNumber className="w-full" min={0.0001} /></Form.Item></Col><Col xs={12} md={4}><Form.Item {...field} name={[field.name, 'purchaseUnitCost']} label="Cost / unit (TZS)" rules={[{ required: true }]}><InputNumber className="w-full" min={0} /></Form.Item></Col><Col xs={12} md={4}><Form.Item label=" "><Button danger block onClick={() => remove(field.name)}>Remove</Button></Form.Item></Col></Row>)}<Button icon={<PlusOutlined />} onClick={() => add({})}>Add material</Button></>}</Form.List>
      <Form.Item name="notes" label="Notes" className="mt-4"><Input.TextArea /></Form.Item><Button type="primary" htmlType="submit" loading={saving}>Post receipt</Button>
    </Form></Modal>
  </div>;
}
