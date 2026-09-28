import { useState } from 'react';
import { Alert,App,Button,Form,InputNumber,Modal,Select,Table,Typography } from 'antd';
import { listRecipes } from '../services/recipeApi';
import { mapOrderRecipe, generateWorkOrder } from '../services/salesApi';
import usePermissions from '../hooks/usePermissions';
import { canMapOrderRecipe } from '../services/orderMappingPolicy';

export default function OrderRecipeMapping({order,onChanged}) {
  const {message}=App.useApp(),{hasPermission}=usePermissions();
  const [form]=Form.useForm(),[item,setItem]=useState(null),[recipes,setRecipes]=useState([]);
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const [generating,setGenerating]=useState(false);
  const recipeId=Form.useWatch('recipeId',form),factor=Form.useWatch('outputPerItem',form);
  const selected=recipes.find(r=>r.id===recipeId);
  const canMap=canMapOrderRecipe(order,hasPermission);
  const canGenerate = order.status === 'CONFIRMED' && hasPermission('EXECUTE_PRODUCTION');
  async function open(row) {
    setLoading(true);setError('');
    try {
      const choices=await listRecipes();setRecipes(choices);setItem(row);
      form.setFieldsValue({recipeId:row.recipeId||undefined,outputPerItem:row.outputPerItem||undefined});
    } catch(e){setError(e.message);} finally{setLoading(false);}
  }
  async function save(values) {
    if(busy)return;
    setBusy(true);setError('');
    try {
      await mapOrderRecipe(order.id,item.id,{...values,version:order.version});
      setItem(null);message.success('Recipe mapping saved');await onChanged();
    } catch(e){setError(e.message);} finally{setBusy(false);}
  }
  async function handleGenerate(row) {
    if(generating)return;
    setGenerating(true);setError('');
    try {
      await generateWorkOrder(order.id,row.id,order.version);
      message.success('Work order generated');await onChanged();
    } catch(e){setError(e.message);} finally{setGenerating(false);}
  }
  const itemsNeedingProduction = (order.items || []).filter(i => !i.finishedProductId);
  const finishedProductItems = (order.items || []).filter(i => !!i.finishedProductId);
  return <>
    <Typography.Title level={4}>Production recipe mapping</Typography.Title>
    {finishedProductItems.length > 0 && <Alert type="success" style={{marginBottom:8}}
      title={`${finishedProductItems.length} finished product item(s) will be fulfilled from existing inventory — no production required.`}/>}
    {itemsNeedingProduction.length === 0 ? (
      <Alert type="info" title="All items in this order are finished products. No production mapping needed — they will be dispatched from existing inventory when fulfilled."/>
    ) : (<>
    <Alert type="info" title="No payment is required to map a recipe. Unpaid, partially paid and fully paid orders can be mapped."
      description="Available for New and Confirmed orders with Sales and Recipe permissions. Once mapped and the order is Confirmed, you can generate work orders."/>
    {!canMap&&<Alert type="warning" title={['NEW','CONFIRMED'].includes(order.status)
      ?'Mapping requires Sales processing and Recipe viewing permissions.'
      :'Recipe mapping is available only for New or Confirmed orders; payment is not the restriction.'}/>}
    {error&&!item&&<Alert type="error" title={error}/>}
    <Table rowKey="id" dataSource={itemsNeedingProduction} pagination={false} scroll={{x:950}} columns={[
      {title:'Order item',dataIndex:'description'},
      {title:'Ordered',render:(_,r)=>`${r.quantity} ${r.unit}`},
      {title:'Recipe',dataIndex:'recipeName',render:v=>v||'Not mapped'},
      {title:'Planned output',render:(_,r)=>r.recipeId?`${r.plannedOutput} ${r.outputUnit}`:'—'},
      {title:'Standard cost (TZS)',dataIndex:'standardCost',render:v=>v==null?'—':Number(v).toLocaleString(undefined,{minimumFractionDigits:2})},
      {title:'Actions',render:(_,r)=>
        <div style={{display:'flex',gap:'8px'}}>
          {canMap&&<Button disabled={busy||loading||generating} onClick={()=>open(r)}>{r.recipeId?'Change mapping':'Map recipe'}</Button>}
          {canGenerate&&r.recipeId&&!r.workOrderId&&<Button type="primary" disabled={busy||loading||generating} onClick={()=>handleGenerate(r)}>Generate work order</Button>}
          {r.workOrderId&&<Typography.Text type="success">Generated</Typography.Text>}
        </div>
      },
    ]}/>
    <Typography.Paragraph>Standard cost is a saved estimate, not actual production cost. Editing order items clears their mappings so quantities must be checked again.</Typography.Paragraph>
    </>)}
    <Modal open={Boolean(item)} title="Map order item to recipe" onOk={()=>form.submit()} onCancel={()=>setItem(null)}
      confirmLoading={busy} closable={!busy} maskClosable={!busy} cancelButtonProps={{disabled:busy}} okButtonProps={{disabled:!selected}}>
      {error&&<Alert type="error" title={error}/>}
      <Typography.Paragraph>{item?.description}: {item?.quantity} {item?.unit}</Typography.Paragraph>
      <Form form={form} layout="vertical" disabled={busy} onFinish={save}>
        <Form.Item name="recipeId" label="Production recipe" rules={[{required:true}]}>
          <Select showSearch optionFilterProp="label" onChange={()=>form.setFieldValue('outputPerItem',undefined)}
            options={recipes.map(r=>({value:r.id,label:`${r.name} — ${r.yieldQuantity} ${r.yieldUnit} per batch`}))}/>
        </Form.Item>
        <Form.Item name="outputPerItem" label={`Recipe output (${selected?.yieldUnit||'select recipe'}) per ordered ${item?.unit||'unit'}`}
          extra="Example: for two 1 kg cakes sold as pieces, enter 1 kg per piece. Do not enter the batch count."
          rules={[{required:true}]}><InputNumber min={0.0001} max={99999999.9999} precision={4} style={{width:'100%'}}/></Form.Item>
      </Form>
      {selected&&factor&&<Typography.Paragraph>Total to produce: {(Number(item?.quantity)*Number(factor)).toLocaleString(undefined,{maximumFractionDigits:4})} {selected.yieldUnit}</Typography.Paragraph>}
    </Modal>
  </>;
}
