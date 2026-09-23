import { useEffect,useState } from 'react';
import { useNavigate,useParams } from 'react-router-dom';
import { Alert,App,Button,Card,Col,Descriptions,Form,Input,InputNumber,Modal,Row,Select,Space,Table,Typography } from 'antd';
import * as api from '../services/salesApi';
import CustomerEditor from '../components/CustomerEditor';
import usePermissions from '../hooks/usePermissions';

export default function OrderEntry() {
  const {id}=useParams(),navigate=useNavigate(),{message}=App.useApp();
  const {hasPermission}=usePermissions(),canView=hasPermission('VIEW_SALES'),canEdit=hasPermission('PROCESS_SALES');
  const [form]=Form.useForm(),[customers,setCustomers]=useState([]),[order,setOrder]=useState(null);
  const [error,setError]=useState(''),[saving,setSaving]=useState(false),[quick,setQuick]=useState(false);
  const [requestId]=useState(api.newRequestId);
  const [editing,setEditing]=useState(false),[action,setAction]=useState(null),[reason,setReason]=useState('');
  function beginEdit() {
    const localDate=new Date(new Date(order.dueAt).getTime()+3*60*60*1000).toISOString().slice(0,16);
    setEditing(true);
    setCustomers([{id:order.customerId,name:order.customerName,phone:order.customerPhone}]);
    form.setFieldsValue({...order,dueAt:localDate,editReason:''});
  }
  async function changeStatus() {
    if(saving || !reason.trim())return;
    setSaving(true);
    try {
      await api.transitionOrder(id,action,{version:order.version,reason});
      setOrder(await api.getOrder(id));setAction(null);setReason('');
      message.success('Order status updated');
    } catch(e){message.error(e.message);} finally{setSaving(false);}
  }
  const values=Form.useWatch([],form)||{};
  const subtotal=(values.items||[]).reduce((sum,i)=>sum+Math.round(Number(i?.quantity||0)*Number(i?.unitPrice||0)*100)/100,0);
  const total=subtotal+Number(values.deliveryCharge||0)-Number(values.discountAmount||0);
  useEffect(()=>{
    if(!canView)return;
    let active=true;
    (id?api.getOrder(id):api.listCustomers()).then(data=>{if(active){if(id)setOrder(data);else setCustomers(data);}})
      .catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[id,canView]);
  async function save(data) {
    if(saving)return;
    setSaving(true);
    try {
      const payload={...data,requestId,dueAt:`${data.dueAt}:00+03:00`};
      if(editing) {
        await api.editOrder(id,{version:order.version,order:payload,reason:data.editReason});
        setOrder(await api.getOrder(id));setEditing(false);message.success('Order updated');
      } else {
        const result=await api.createOrder(payload);
        message.success('Order recorded');navigate(`/sales/${result.id}`);
      }
    } catch(e){message.error(e.message);} finally{setSaving(false);}
  }
  if(!canView || (!id && !canEdit))return <Alert type="warning" title="Sales permission required." />;
  const amount=(name,label)=><Col xs={24} md={8}><Form.Item name={name} label={label} rules={[{required:true}]}><InputNumber min={0} max={999999999999.99} precision={2} style={{width:'100%'}} /></Form.Item></Col>;
  return <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
    <Button onClick={()=>navigate('/sales')} disabled={saving}>Back to orders</Button>
    <Typography.Title level={2}>{editing?'Edit order':id?'Order details':'New order'}</Typography.Title>
    {error && <Alert type="error" title={error} />}
    <Alert type="info" title="Payments and production linkage are pending. Deposit below is the agreed amount, not a recorded payment." style={{marginBottom:16}} />
    {id && !editing ? order && <Card className="dark:bg-slate-800">
      <Space wrap style={{marginBottom:16}}>
        <Typography.Text strong>{order.orderNumber} · {order.status}</Typography.Text>
        {canEdit && Number.isInteger(order.version) && order.status==='NEW' && <>
          <Button disabled={saving} onClick={beginEdit}>Edit order</Button>
          <Button type="primary" disabled={saving} onClick={()=>{setReason('Order confirmed');setAction('confirm');}}>Confirm order</Button>
        </>}
        {canEdit && Number.isInteger(order.version) && ['NEW','CONFIRMED'].includes(order.status) && <Button danger disabled={saving} onClick={()=>{setReason('');setAction('cancel');}}>Cancel order</Button>}
      </Space>
      {!Number.isInteger(order.version) && <Alert type="info" title="Order editing and status actions require the Sales lifecycle backend update." />}
      <Descriptions column={2} items={[
        {key:'id',label:'Order ID',children:order.id},{key:'name',label:'Customer',children:order.customerName},
        {key:'phone',label:'Phone',children:order.customerPhone},{key:'email',label:'Email',children:order.customerEmail||'—'},
        {key:'due',label:'Due (Dar es Salaam)',children:new Date(order.dueAt).toLocaleString(undefined,{timeZone:'Africa/Dar_es_Salaam'})},
        {key:'fulfilment',label:'Fulfilment',children:order.fulfilment},{key:'address',label:'Delivery address',children:order.deliveryAddress||'—'},
        {key:'subtotal',label:'Subtotal (TZS)',children:order.subtotal},{key:'delivery',label:'Delivery charge (TZS)',children:order.deliveryCharge},
        {key:'discount',label:'Discount (TZS)',children:order.discountAmount},{key:'total',label:'Total (TZS)',children:order.total},
        {key:'deposit',label:'Agreed deposit (TZS)',children:order.depositRequired},{key:'discountNote',label:'Discount note',children:order.discountNote||'—'},
        {key:'notes',label:'Notes',children:order.notes||'—'},
      ]} />
      <Typography.Title level={4}>Order history</Typography.Title>
      <Table rowKey="id" dataSource={order.history||[]} pagination={false} scroll={{x:700}} columns={[
        {title:'Action',dataIndex:'action'},{title:'Reason',dataIndex:'reason'},
        {title:'Previous discount',dataIndex:'oldDiscount'},{title:'New discount',dataIndex:'newDiscount'},
        {title:'Recorded by',dataIndex:'actor'},
        {title:'Time',dataIndex:'createdAt',render:v=>new Date(v).toLocaleString(undefined,{timeZone:'Africa/Dar_es_Salaam'})},
      ]} />
      <Table rowKey="id" dataSource={order.items} pagination={false} scroll={{x:750}} columns={[
        {title:'Item',dataIndex:'description'},{title:'Quantity',dataIndex:'quantity'},{title:'Unit',dataIndex:'unit'},
        {title:'Price (TZS)',dataIndex:'unitPrice'},{title:'Total (TZS)',dataIndex:'lineTotal'},{title:'Instructions',dataIndex:'instructions'},
      ]} />
    </Card> : <Form form={form} layout="vertical" onFinish={save} disabled={saving} scrollToFirstError
      initialValues={{fulfilment:'COLLECTION',deliveryCharge:0,discountAmount:0,depositRequired:0,items:[{quantity:1,unit:'piece',unitPrice:0}]}}>
      <Card className="dark:bg-slate-800" title="Customer & fulfilment" style={{marginBottom:24}}>
        <Row gutter={16}>
          <Col xs={24} md={18}><Form.Item name="customerId" label="Customer" rules={[{required:true}]}><Select disabled={editing} showSearch optionFilterProp="label"
            options={customers.map(c=>({value:c.id,label:`${c.name} — ${c.phone}`}))} /></Form.Item></Col>
          <Col xs={24} md={6}><Form.Item label="New customer"><Button disabled={editing} onClick={()=>setQuick(true)}>Add customer</Button></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="dueAt" label="Due date & time (Dar es Salaam)" rules={[{required:true}]}><Input type="datetime-local" /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="fulfilment" label="Fulfilment" rules={[{required:true}]}><Select options={[{value:'COLLECTION',label:'Collection'},{value:'DELIVERY',label:'Delivery'}]} /></Form.Item></Col>
          <Col span={24}><Form.Item name="deliveryAddress" label="Delivery address" rules={[{required:values.fulfilment==='DELIVERY',whitespace:true}]}><Input.TextArea rows={2} maxLength={1000} /></Form.Item></Col>
        </Row>
      </Card>
      <Card className="dark:bg-slate-800" title="Order items" style={{marginBottom:24}}>
        <Form.List name="items" rules={[{validator:async(_,items)=>{if(!items?.length)throw new Error('Add at least one item');}}]}>
          {(fields,{add,remove},{errors})=><>
            {fields.map(({key,name,...field})=><Row gutter={12} key={key}>
              <Col xs={24} md={8}><Form.Item {...field} name={[name,'description']} label="Item / description" rules={[{required:true,whitespace:true}]}><Input maxLength={255} /></Form.Item></Col>
              <Col xs={12} md={4}><Form.Item {...field} name={[name,'quantity']} label="Quantity" rules={[{required:true}]}><InputNumber min={0.0001} max={99999999.9999} precision={4} style={{width:'100%'}} /></Form.Item></Col>
              <Col xs={12} md={4}><Form.Item {...field} name={[name,'unit']} label="Unit" rules={[{required:true,whitespace:true}]}><Input maxLength={40} /></Form.Item></Col>
              <Col xs={18} md={5}><Form.Item {...field} name={[name,'unitPrice']} label="Price (TZS)" rules={[{required:true}]}><InputNumber min={0} max={9999999999.99} precision={2} style={{width:'100%'}} /></Form.Item></Col>
              <Col xs={6} md={3}><Form.Item label=" "><Button danger onClick={()=>remove(name)}>Remove</Button></Form.Item></Col>
              <Col span={24}><Form.Item {...field} name={[name,'instructions']} label="Special instructions"><Input.TextArea rows={2} maxLength={1000} /></Form.Item></Col>
            </Row>)}
            <Form.ErrorList errors={errors}/><Button onClick={()=>add({quantity:1,unit:'piece',unitPrice:0})} disabled={fields.length>=100 || saving}>Add item</Button>
          </>}
        </Form.List>
      </Card>
      <Card className="dark:bg-slate-800" title="Agreed price & notes" style={{marginBottom:24}}>
        <Row gutter={16}>{amount('deliveryCharge','Delivery charge (TZS)')}{amount('discountAmount','Discount amount (TZS)')}{amount('depositRequired','Agreed deposit (TZS)')}
          <Col span={24}><Form.Item name="discountNote" label="Discount / negotiation note"><Input maxLength={1000}/></Form.Item></Col>
          <Col span={24}><Form.Item name="notes" label="Order notes"><Input.TextArea rows={3} maxLength={4000}/></Form.Item></Col>
        </Row>
        <Typography.Paragraph>Subtotal: TZS {subtotal.toFixed(2)} · Total after discount: TZS {total.toFixed(2)}</Typography.Paragraph>
        {(total<0 || Number(values.depositRequired)>total) && <Alert type="error" title="Discount or agreed deposit exceeds the available total." />}
      </Card>
      {editing && <Form.Item name="editReason" label="Reason for change" rules={[{required:true,whitespace:true}]}><Input maxLength={1000}/></Form.Item>}
      <Space><Button type="primary" htmlType="submit" loading={saving} disabled={total<0 || Number(values.depositRequired)>total}>{editing?'Save changes':'Record order'}</Button>
        {editing && <Button disabled={saving} onClick={()=>setEditing(false)}>Discard changes</Button>}
      </Space>
    </Form>}
    <Modal open={Boolean(action)} title={action==='cancel'?'Cancel this order?':'Confirm this order?'} confirmLoading={saving}
      closable={!saving} maskClosable={!saving} cancelButtonProps={{disabled:saving}}
      okButtonProps={{disabled:!reason.trim(),danger:action==='cancel'}} onOk={changeStatus} onCancel={()=>setAction(null)}>
      <Typography.Paragraph>{action==='cancel'?'The order will remain in history and cannot be edited.':'Confirmation locks editing. Payment recording and production linkage are still pending.'}</Typography.Paragraph>
      <label htmlFor="order-action-reason">Reason</label>
      <Input.TextArea id="order-action-reason" value={reason} disabled={saving} maxLength={1000} onChange={e=>setReason(e.target.value)}/>
    </Modal>
    {quick && <CustomerEditor quick onClose={()=>setQuick(false)} onSaved={c=>{setCustomers(prev=>[...prev,c]);form.setFieldValue('customerId',c.id);}} />}
  </div>;
}
