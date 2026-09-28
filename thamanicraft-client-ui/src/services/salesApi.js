import Cookies from 'js-cookie';
async function request(path,method='GET',body) {
  const token=Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
  const response=await fetch(`/api/sales${path}`,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body===undefined?undefined:JSON.stringify(body)});
  if(!response.ok) { const error=await response.json().catch(()=>({})); throw new Error(error.detail || `Sales request failed (${response.status})`); }
  return response.json();
}
export const listCustomers=()=>request('/customers');
export const saveCustomer=(id,data)=>request(`/customers${id?`/${id}`:''}`,id?'PUT':'POST',data);
export const listOrders=()=>request('/orders');
export const getOrder=id=>request(`/orders/${id}`);
export const createOrder=data=>request('/orders','POST',data);
export const mapOrderRecipe=(order,item,data)=>request(`/orders/${order}/items/${item}/recipe`,'PUT',data);
export const generateWorkOrder=async (order,item,version)=>{
  const token=Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
  const response=await fetch(`/api/sales/orders/${order}/items/${item}/work-order`,{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({version})
  });
  if(!response.ok) { const error=await response.json().catch(()=>({})); throw new Error(error.detail || `Work order generation failed (${response.status})`); }
};
export const recordPayment=(id,data)=>request(`/orders/${id}/payments`,'POST',data);
export const reversePayment=(id,payment,reason)=>request(`/orders/${id}/payments/${payment}/reverse`,'POST',{reason});
export const editOrder=(id,data)=>request(`/orders/${id}`,'PUT',data);
export const transitionOrder=(id,action,data)=>request(`/orders/${id}/${action}`,'POST',data);
export const fulfillOrder=(id,data)=>request(`/orders/${id}/fulfill`,'POST',data);
export const settleCancellationOrder=(id,data)=>request(`/orders/${id}/settle-cancellation`,'POST',data);
export function newRequestId() {
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  bytes[6]=(bytes[6]&15)|64; bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
