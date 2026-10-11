import Cookies from 'js-cookie';

const API_BASE_URL = '/api/subscriptions';

const getHeaders = () => {
  const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const getTenantIdFromToken = () => {
  const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
  if (!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    const decoded = JSON.parse(atob(payloadBase64));
    return decoded.tenant_id; 
  } catch (e) {
    return null;
  }
}

export const fetchMySubscription = async () => {
  const tenantId = getTenantIdFromToken();
  if (!tenantId) throw new Error("No tenant ID found in token");
  const response = await fetch(`${API_BASE_URL}/tenant/${tenantId}`, { headers: getHeaders() });
  if (!response.ok) {
     const error = await response.json().catch(() => ({}));
     throw new Error(error.message || 'Failed to fetch subscription');
  }
  return response.json();
};

export const fetchPlans = async () => {
  const response = await fetch(`${API_BASE_URL}/plans`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch plans');
  return response.json();
};

export const assignPlan = async (planCode) => {
  const tenantId = getTenantIdFromToken();
  if (!tenantId) throw new Error("No tenant ID found in token");
  
  const response = await fetch(`${API_BASE_URL}/tenant/${tenantId}/assign/${planCode}`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to assign plan');
  }
  return response.json();
};

export const fetchInvoices = async () => {
  const tenantId = getTenantIdFromToken();
  if (!tenantId) throw new Error("No tenant ID found in token");
  const response = await fetch(`${API_BASE_URL}/tenant/${tenantId}/invoices`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
};

export const submitProofOfPayment = async (invoiceId, reference, proofBase64) => {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/submit-proof`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reference, proofBase64 })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to submit proof');
  }
  return response.json();
};
