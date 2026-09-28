import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, App, Button, Card, Col, Descriptions, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Spin, Table, Tag, Typography, Modal } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import * as api from '../services/productionApi';
import usePermissions from '../hooks/usePermissions';

const money = value => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function WorkOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { hasPermission } = usePermissions();
  const canView = hasPermission('VIEW_PRODUCTION');
  const canEdit = hasPermission('EXECUTE_PRODUCTION');
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [completeModal, setCompleteModal] = useState(false);
  const [order, setOrder] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const selected = Form.useWatch('recipeId', form);
  const recipe = recipes.find(r => r.id === selected);
  useEffect(() => {
    if (!canView) return;
    let active = true;
    Promise.all([api.productionRecipes(), id ? api.getWorkOrder(id) : Promise.resolve(null)])
      .then(([choices, record]) => {
        if (!active) return;
        setRecipes(choices); setOrder(record); setError(''); setDirty(false);
        form.setFieldsValue(record || { plannedYield: 1, version: 0 });
      }).catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [id, canView, form, revision]);

  useEffect(() => {
    if (!order || order.status !== 'COMPLETION_PENDING') return;
    const timer = setInterval(() => {
      api.getWorkOrder(id).then(record => {
        setOrder(record);
        if (record.status !== 'COMPLETION_PENDING') {
          setRevision(v => v + 1);
        }
      }).catch(err => console.error("Polling error", err));
    }, 2000);
    return () => clearInterval(timer);
  }, [order?.status, id]);
  async function save(values) {
    if (saving) return;
    setSaving(true);
    try {
      const result = await api.saveWorkOrder(id, { ...values, scheduledDate: values.scheduledDate || null, version: order?.version || 0 });
      message.success('Work order saved');
      if (id) setRevision(v => v + 1); else navigate(`/production/${result.id}`);
    } catch (failure) { message.error(failure.message); }
    finally { setSaving(false); }
  }
  async function transition(action) {
    if (saving) return;
    setSaving(true);
    try {
      await api.transitionWorkOrder(id, action, order.version);
      message.success('Work order updated'); setRevision(v => v + 1);
    } catch (failure) { message.error(failure.message); }
    finally { setSaving(false); }
  }
  
  function openCompleteModal() {
    completeForm.setFieldsValue({
      actualYield: order.actualYield || order.plannedYield,
      scrapCount: order.scrapCount || 0,
      ingredients: order.ingredients.map(i => ({ materialId: i.materialId, name: i.name, unit: i.unit, actualQuantity: i.actualQuantity || i.quantity }))
    });
    setCompleteModal(true);
  }
  
  async function completeBatch(values) {
    if (saving) return;
    setSaving(true);
    try {
      await api.completeWorkOrder(id, { ...values, version: order.version });
      message.success('Work order completed');
      setCompleteModal(false);
      setRevision(v => v + 1);
    } catch (failure) { message.error(failure.message); }
    finally { setSaving(false); }
  }
  if (!canView) return <Alert type="warning" title="Production viewing permission is required." />;
  const draft = !order || order.status === 'DRAFT';
  const hasShortage = order?.ingredients?.some(line => !line.compatible || Number(line.available) < Number(line.quantity));
  const action = (name, label, danger = false) => <Popconfirm title={`${label}?`} description="This does not reserve or deduct stock." onConfirm={() => transition(name)} disabled={saving || dirty}>
    <Button danger={danger} disabled={saving || dirty} loading={saving}>{label}</Button>
  </Popconfirm>;
  return <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production')} disabled={saving} style={{ marginBottom: 16 }}>Back to work orders</Button>
    <Typography.Title level={2}>{id ? 'Work order' : 'New work order'} {order && <Tag>{order.status.replaceAll('_', ' ')}</Tag>}</Typography.Title>
    <Alert type="info" showIcon title="Development stage: completion uses a basic outbox pattern."
      description="Scheduling freezes recipe requirements and planned costs. Stock availability is advisory. Completion sends outbox events." style={{ marginBottom: 16 }} />
    {!loaded ? <Spin /> : error ? <Alert type="error" title={error} action={<Button onClick={() => setRevision(v => v + 1)}>Reload</Button>} /> : <>
      <Card className="dark:bg-slate-800" title="Work order details" style={{ marginBottom: 24 }}>
        {draft ? <Form form={form} layout="vertical" onFinish={save} onValuesChange={() => setDirty(true)} disabled={!canEdit || saving} scrollToFirstError>
          <Row gutter={16}>
            <Col xs={24} md={12}><Form.Item name="recipeId" label="Recipe" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={recipes.map(r => ({ value: r.id, label: r.name }))} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="plannedYield" label={`Planned output (${recipe?.outputUnit || 'recipe output unit'})`} rules={[{ required: true }]}
              extra={recipe ? `Recipe produces ${recipe.yieldQuantity} ${recipe.outputUnit} per batch.` : 'Select a recipe.'}><InputNumber min={0.01} max={99999999.99} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="reference" label="Reference"><Input maxLength={255} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="scheduledDate" label="Scheduled date" extra="Required before scheduling."><Input type="date" /></Form.Item></Col>
            <Col span={24}><Form.Item name="notes" label="Notes"><Input.TextArea rows={3} maxLength={4000} /></Form.Item></Col>
          </Row>
          {canEdit && <Button type="primary" htmlType="submit" loading={saving}>Save draft</Button>}
          <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>Save the draft to calculate requirements. Save any changes before scheduling.</Typography.Paragraph>
        </Form> : <Descriptions column={{ xs: 1, md: 2 }} items={[
          { key: 'recipe', label: 'Recipe', children: order.recipeName },
          { key: 'quantity', label: 'Planned output', children: `${order.plannedYield} ${order.outputUnit}` },
          { key: 'reference', label: 'Reference', children: order.reference || '—' },
          { key: 'date', label: 'Scheduled date', children: order.scheduledDate || '—' },
          { key: 'notes', label: 'Notes', children: order.notes || '—', span: 2 },
        ]} />}
      </Card>
      {order && <>
        <Card className="dark:bg-slate-800" title="Saved material requirements" style={{ marginBottom: 24 }}>
          {hasShortage && <Alert type="warning" title="Some materials have insufficient stock or changed units." style={{ marginBottom: 16 }} />}
          <Table rowKey="materialId" pagination={false} dataSource={order.ingredients} scroll={{ x: 850 }} columns={[
            { title: 'Material', dataIndex: 'name' }, { title: 'Unit', dataIndex: 'unit' },
            { title: 'Required (incl. allowance)', dataIndex: 'quantity' },
            { title: 'Available now', dataIndex: 'available' },
            { title: 'Availability', key: 'availability', render: (_, line) => !line.compatible ? 'Unavailable / unit changed' : Number(line.available) < Number(line.quantity) ? 'Shortage' : 'Available' },
            { title: 'Planned cost (TZS)', dataIndex: 'lineCost', render: money, align: 'right' },
          ]} expandable={{ rowExpandable: line => Boolean(line.instructions), expandedRowRender: line => <Typography.Paragraph>{line.instructions}</Typography.Paragraph> }} />
        </Card>
        <Card className="dark:bg-slate-800" title="Saved planned costs" style={{ marginBottom: 24 }}>
          <Descriptions items={[
            { key: 'labor', label: 'Labour (TZS)', children: money(order.plannedLabor) },
            { key: 'energy', label: 'Energy (TZS)', children: money(order.plannedEnergy) },
            { key: 'overhead', label: 'Additional overhead (TZS)', children: money(order.plannedOverhead) },
            { key: 'total', label: 'Total incl. ingredients (TZS)', children: money(order.plannedCost) },
          ]} />
          <Typography.Paragraph>Planning values only—not actual production costs. Scheduling refreshes these from the current recipe and freezes them.</Typography.Paragraph>
          {canEdit && <Space wrap>
            {order.status === 'DRAFT' && action('schedule', 'Schedule saved draft')}
            {order.status === 'SCHEDULED' && action('start', 'Start batch')}
            {order.status === 'IN_PROGRESS' && <Button type="primary" onClick={openCompleteModal}>Complete batch...</Button>}
            {order.status === 'COMPLETION_FAILED' && <Button type="primary" onClick={openCompleteModal}>Retry completion...</Button>}
            {['DRAFT', 'SCHEDULED'].includes(order.status) && action('cancel', 'Cancel work order', true)}
          </Space>}
        </Card>
        <Card className="dark:bg-slate-800" title="History">
          <Table rowKey="id" dataSource={order.history} pagination={false} columns={[
            { title: 'Action', dataIndex: 'action' },
            { title: 'When', dataIndex: 'recordedAt', render: value => new Date(value).toLocaleString() },
          ]} />
        </Card>
      </>}
    </>}
    <Modal title="Complete Production Batch" open={completeModal} onCancel={() => setCompleteModal(false)} onOk={completeForm.submit} confirmLoading={saving} width={800}>
      <Alert type="info" message="Review and record actual usage and output before confirming completion." showIcon style={{marginBottom: 16}} />
      <Form form={completeForm} layout="vertical" onFinish={completeBatch}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="actualYield" label={`Actual good output (${order?.outputUnit || ''})`} rules={[{required: true}]}>
               <InputNumber min={0.01} precision={2} style={{width:'100%'}} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="scrapCount" label={`Scrap/rejected (${order?.outputUnit || ''})`} rules={[{required: true}]}>
               <InputNumber min={0} precision={2} style={{width:'100%'}} />
            </Form.Item>
          </Col>
        </Row>
        <Typography.Title level={5}>Ingredient Actuals</Typography.Title>
        <Form.List name="ingredients">
          {(fields) => (
            <Table size="small" pagination={false} dataSource={fields} rowKey="name" columns={[
              { title: 'Material', render: (_, field) => completeForm.getFieldValue(['ingredients', field.name, 'name']) },
              { title: 'Unit', render: (_, field) => completeForm.getFieldValue(['ingredients', field.name, 'unit']) },
              { title: 'Actual Quantity', render: (_, field) => (
                  <>
                    <Form.Item name={[field.name, 'materialId']} noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name={[field.name, 'actualQuantity']} rules={[{required:true}]} noStyle>
                       <InputNumber min={0.0001} precision={4} />
                    </Form.Item>
                  </>
                )
              }
            ]} />
          )}
        </Form.List>
      </Form>
    </Modal>
  </div>;
}
