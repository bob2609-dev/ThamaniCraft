import { useState } from 'react';
import { Alert,App,Button,Descriptions,Form,Input,InputNumber,Modal,Select,Table,Typography } from 'antd';
import { newRequestId,recordPayment,reversePayment } from '../services/salesApi';
import usePermissions from '../hooks/usePermissions';

export default function OrderPayments({order,onChanged}) {
  const {message}=App.useApp(),{hasPermission}=usePermissions();
  const [form]=Form.useForm(),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
  const [requestId,setRequestId]=useState(null),[correction,setCorrection]=useState(null),[reason,setReason]=useState('');
  const [error,setError]=useState('');
  const money=value=>Number(value||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  async function save(values) {
    if(busy)return;
    setBusy(true);setError('');
    try {
      await recordPayment(order.id,{...values,requestId,receivedAt:`${values.receivedAt}:00+03:00`});
      setOpen(false);message.success('Payment recorded');await onChanged();
    } catch(e){setError(e.message);} finally{setBusy(false);}
  }
  async function reverse() {
    if(busy || !reason.trim())return;
    setBusy(true);setError('');
    try {
      await reversePayment(order.id,correction.id,reason);
      setCorrection(null);message.success('Receipt correction recorded');await onChanged();
    } catch(e){setError(e.message);} finally{setBusy(false);}
  }
  if(order.netPaid===undefined)return <Alert type="info" title="Payment recording requires the Sales payment backend update." />;
  return <>
    <Typography.Title level={4}>Payments</Typography.Title>
    <Descriptions items={[
      {key:'paid',label:'Net received (TZS)',children:money(order.netPaid)},
      {key:'balance',label:'Outstanding (TZS)',children:money(order.balance)},
      {key:'deposit',label:'Deposit shortfall (TZS)',children:money(order.depositShortfall)},
      {key:'status',label:'Payment status',children:order.paymentStatus},
    ]}/>
    {order.status==='CANCELLED' && Number(order.refundDue)>0 && <Alert type="warning" title={`Refund due: TZS ${money(order.refundDue)}. Actual refund recording is not yet supported.`}/>}
    <Typography.Paragraph>Manually record money actually received. This does not confirm the order, start production or change stock.</Typography.Paragraph>
    {hasPermission('RECORD_PAYMENTS') && order.status!=='CANCELLED' && Number(order.balance)>0 &&
      <Button type="primary" disabled={busy} onClick={()=>{
        setRequestId(newRequestId());setError('');form.resetFields();
        form.setFieldsValue({method:'CASH',receivedAt:new Date(Date.now()+10800000).toISOString().slice(0,16)});
        setOpen(true);
      }}>Record payment</Button>}
    {error && !open && !correction && <Alert type="error" title={error}/>}
    <Table rowKey="id" dataSource={order.payments||[]} pagination={false} scroll={{x:1000}} columns={[
      {title:'Received (Dar es Salaam)',dataIndex:'receivedAt',render:v=>new Date(v).toLocaleString(undefined,{timeZone:'Africa/Dar_es_Salaam'})},
      {title:'Amount (TZS)',dataIndex:'amount',render:money},{title:'Method',dataIndex:'method'},
      {title:'Reference',dataIndex:'reference'},{title:'Recorded by',dataIndex:'actor'},
      {title:'Status',render:(_,p)=>p.reversedAt?'REVERSED':'RECEIVED'},
      {title:'Correction reason',dataIndex:'reversalReason'},
      {title:'Reversed by',dataIndex:'reversedBy'},
      {title:'Reversed at',dataIndex:'reversedAt',render:v=>v?new Date(v).toLocaleString(undefined,{timeZone:'Africa/Dar_es_Salaam'}):'—'},
      {title:'Actions',render:(_,p)=>!p.reversedAt&&hasPermission('REVERSE_PAYMENTS')&&<Button danger disabled={busy} onClick={()=>{setCorrection(p);setReason('');setError('');}}>Correct receipt</Button>},
    ]}/>
    <Modal open={open} title="Record payment received" onCancel={()=>setOpen(false)} closable={!busy} mask={{ closable: !busy }}
      cancelButtonProps={{disabled:busy}} confirmLoading={busy} onOk={()=>form.submit()}>
      {error && <Alert type="error" title={error}/>}
      <Form form={form} layout="vertical" onFinish={save} disabled={busy}>
        <Form.Item name="amount" label="Amount received (TZS)" rules={[{required:true}]}><InputNumber min={0.01} max={Number(order.balance)} precision={2} style={{width:'100%'}}/></Form.Item>
        <Form.Item name="receivedAt" label="Received date & time (Dar es Salaam)" rules={[{required:true}]}><Input type="datetime-local"/></Form.Item>
        <Form.Item name="method" label="Payment method" rules={[{required:true}]}><Select options={['CASH','MOBILE_MONEY','BANK','OTHER'].map(value=>({value,label:value.replaceAll('_',' ')}))}/></Form.Item>
        <Form.Item name="reference" label="Transaction reference / note"><Input maxLength={255}/></Form.Item>
      </Form>
      <Typography.Paragraph>If a request fails, retry here without changing its details. Check history before creating a new receipt.</Typography.Paragraph>
    </Modal>
    <Modal open={Boolean(correction)} title="Reverse an erroneous receipt?" onCancel={()=>setCorrection(null)} closable={!busy} mask={{ closable: !busy }}
      cancelButtonProps={{disabled:busy}} confirmLoading={busy} okButtonProps={{danger:true,disabled:!reason.trim()}} onOk={reverse}>
      <Alert type="warning" title="This reverses the full receipt for a recording error. It does not record a real refund. The original receipt stays in history."/>
      {error && <Alert type="error" title={error}/>}
      <label htmlFor="receipt-correction-reason">Reason for correction</label>
      <Input.TextArea id="receipt-correction-reason" value={reason} disabled={busy} maxLength={1000} onChange={e=>setReason(e.target.value)}/>
    </Modal>
  </>;
}
