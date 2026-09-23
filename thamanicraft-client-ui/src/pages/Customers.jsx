import { useEffect,useState } from 'react';
import { Alert,Button,Card,Input,Space,Table,Typography } from 'antd';
import { listCustomers } from '../services/salesApi';
import CustomerEditor from '../components/CustomerEditor';
import usePermissions from '../hooks/usePermissions';

export default function Customers() {
  const {hasPermission}=usePermissions();
  const canView=hasPermission('VIEW_SALES'), canEdit=hasPermission('PROCESS_SALES');
  const [rows,setRows]=useState([]),[error,setError]=useState(''),[revision,setRevision]=useState(0);
  const [editor,setEditor]=useState(null),[search,setSearch]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!canView) return;
    let active=true;
    listCustomers().then(data=>{if(active){setRows(data);setError('');}})
      .catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[revision,canView]);
  if(!canView) return <Alert type="warning" title="Sales viewing permission required." />;
  return <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
    <Space wrap style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
      <Typography.Title level={2}>Customers</Typography.Title>
      {canEdit && <Button type="primary" onClick={()=>setEditor({})}>Add customer</Button>}
    </Space>
    {error && <Alert type="error" title={error} action={<Button onClick={()=>setRevision(v=>v+1)}>Retry</Button>} />}
    <Card className="dark:bg-slate-800">
      <Input aria-label="Search customers" placeholder="Search name or phone" value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:16,maxWidth:400}} />
      <Table rowKey="id" loading={loading} dataSource={rows.filter(r=>`${r.name} ${r.phone}`.toLowerCase().includes(search.toLowerCase()))}
        scroll={{x:800}} columns={[
          {title:'Name',dataIndex:'name'},{title:'Phone',dataIndex:'phone'},{title:'Email',dataIndex:'email'},{title:'Address',dataIndex:'address'},
          {title:'Actions',key:'actions',render:(_,r)=>canEdit && <Button onClick={()=>setEditor(r)}>Edit</Button>},
        ]} />
    </Card>
    {editor && <CustomerEditor customer={editor.id?editor:null} onClose={()=>setEditor(null)} onSaved={()=>setRevision(v=>v+1)} />}
  </div>;
}
