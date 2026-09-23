import Cookies from 'js-cookie';
async function request(path, method = 'GET', body) {
  const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
  const response = await fetch(`/api/finance${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `Finance request failed (${response.status})`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
export const getExpenses = () => request('/expenses');
export const getAssets = () => request('/assets');
export const getLeases = () => request('/leases');
export const saveFinanceRecord = (kind, id, values) => request(`/${kind}${id ? `/${id}` : ''}`, id ? 'PUT' : 'POST', values);
