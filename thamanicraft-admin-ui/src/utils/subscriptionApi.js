import api from './api';

export const fetchPlans = async () => {
  const response = await api.get('/subscriptions/plans');
  return response.data;
};

export const createPlan = async (planData) => {
  const response = await api.post('/subscriptions/plans', planData);
  return response.data;
};

export const updatePlan = async (planId, planData) => {
  const response = await api.put(`/subscriptions/plans/${planId}`, planData);
  return response.data;
};

export const fetchTenantSubscription = async (tenantId) => {
  const response = await api.get(`/subscriptions/tenant/${tenantId}`);
  return response.data;
};

export const assignPlanToTenant = async (tenantId, planCode) => {
  const response = await api.post(`/subscriptions/tenant/${tenantId}/assign/${planCode}`);
  return response.data;
};

export const fetchPendingInvoices = async () => {
  const response = await api.get('/subscriptions/invoices/pending');
  return response.data;
};

export const fetchTenantInvoices = async (tenantId) => {
  const response = await api.get(`/subscriptions/tenant/${tenantId}/invoices`);
  return response.data;
};

export const approveInvoice = async (invoiceId) => {
  const response = await api.post(`/subscriptions/invoices/${invoiceId}/approve`);
  return response.data;
};

export const rejectInvoice = async (invoiceId, reason) => {
  const response = await api.post(`/subscriptions/invoices/${invoiceId}/reject`, { reason });
  return response.data;
};
