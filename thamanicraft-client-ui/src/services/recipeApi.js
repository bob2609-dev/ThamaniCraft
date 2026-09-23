import Cookies from 'js-cookie';

async function request(path = '', method = 'GET', body) {
  const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
  const response = await fetch(`/api/production/recipes${path}`, {
    method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `Recipe request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}
export const listRecipes = () => request();
export const getRecipe = (id) => request(`/${id}`);
export const saveRecipe = (id, recipe) => request(id ? `/${id}` : '', id ? 'PUT' : 'POST', recipe);
export const archiveRecipe = (id) => request(`/${id}`, 'DELETE');
