import { useEffect,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert,Button,Card,Input,Select,Space,Table,Tag,Typography } from 'antd';
import { listOrders } from '../services/salesApi';
import usePermissions from '../hooks/usePermissions';

export default function Sales() {
  const navigate=useNavigate();
  const {hasPermission}=usePermissions(),canView=hasPermission('VIEW_SALES');
  const [rows,setRows]=useState([]),[error,setError]=useState(''),[search,setSearch]=useState(''),[revision,setRevision]=useState(0);
  const [status,setStatus]=useState('OPEN');
  const [paymentStatus,setPaymentStatus]=useState('ALL');
  useEffect(()=>{
    if(!canView)return;
    let active=true;
    listOrders().then(data=>{if(active){setRows(data);setError('');}}).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[canView,revision]);
  if(!canView)return <Alert type="warning" title="Sales viewing permission required." />;
  return <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
    <Space wrap style={{display:'flex',justifyContent:'space-between'}}><Typography.Title level={2}>Customer orders</Typography.Title>
      {hasPermission('PROCESS_SALES') && <Button type="primary" onClick={()=>navigate('/sales/new')}>New order</Button>}</Space>
    <Alert type="info" title="Record actual payments and track finished goods delivery/collection fulfillment from order details." style={{marginBottom:16}} />
    {error && <Alert type="error" title={error} action={<Button onClick={()=>setRevision(v=>v+1)}>Retry</Button>} />}
    <Card className="dark:bg-slate-800"><Input aria-label="Search orders" placeholder="Search customer, phone or order ID" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:400,marginBottom:16}} />
      <Select aria-label="Filter order status" value={status} onChange={setStatus} style={{minWidth:180,marginBottom:16,marginLeft:12}}
        options={['OPEN','ALL','NEW','CONFIRMED','CANCELLED','OVERDUE'].map(value=>({value,label:value}))}/>
      <Select aria-label="Filter payment status" value={paymentStatus} onChange={setPaymentStatus} style={{minWidth:180,marginLeft:12}}
        options={['ALL','UNPAID','PARTIAL','PAID','REFUND_DUE'].map(value=>({value,label:value==='ALL'?'All payment statuses':value}))}/>
      <Table rowKey="id" dataSource={rows.filter(r=>`${r.orderNumber} ${r.id} ${r.customerName} ${r.customerPhone}`.toLowerCase().includes(search.toLowerCase()))
        .filter(r=>status==='ALL'||(status==='OPEN'?!['CANCELLED','DELIVERED','COLLECTED'].includes(r.status):status==='OVERDUE'?!['CANCELLED','DELIVERED','COLLECTED'].includes(r.status)&&new Date(r.dueAt)<new Date():r.status===status))
        .filter(r=>paymentStatus==='ALL'||r.paymentStatus===paymentStatus)}
        scroll={{x:1050}} columns={[
          {title:'Order',dataIndex:'orderNumber'},{title:'Customer',dataIndex:'customerName'},{title:'Phone',dataIndex:'customerPhone'},
          {title:'Due (Dar es Salaam)',dataIndex:'dueAt',render:v=>new Date(v).toLocaleString(undefined,{timeZone:'Africa/Dar_es_Salaam'})},
          {title:'Status',dataIndex:'status'},
          {title:'Fulfillment',dataIndex:'fulfillmentStatus',render:v=><Tag color={v==='FULFILLED'?'green':'orange'}>{v||'UNFULFILLED'}</Tag>},
          {title:'Total (TZS)',dataIndex:'total'},
          {title:'Net paid (TZS)',dataIndex:'netPaid'},{title:'Balance (TZS)',dataIndex:'balance'},
          {title:'Payment status',dataIndex:'paymentStatus'},
          {title:'Actions',key:'actions',render:(_,r)=><Button onClick={()=>navigate(`/sales/${r.id}`)}>Open</Button>},
        ]} />
    </Card>
  </div>;
}
