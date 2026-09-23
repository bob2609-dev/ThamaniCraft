import Cookies from 'js-cookie';

async function request(path = '', method = 'GET', body) {
  const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
  const response = await fetch(`/api/production/work-orders${path}`, {
    method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `Production request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}
export const listWorkOrders = () => request();
export const productionRecipes = () => request('/recipes');
export const getWorkOrder = id => request(`/${id}`);
export const saveWorkOrder = (id, values) => request(id ? `/${id}` : '', id ? 'PUT' : 'POST', values);
export const transitionWorkOrder = (id, action, version) => request(`/${id}/${action}`, 'POST', { version });
