import Cookies from 'js-cookie';

const API_BASE_URL = '/api/inventory';

const getHeaders = () => {
  const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const responseError = async (response, fallbackMessage) => {
  const body = await response.json().catch(() => null);
  throw new Error(body?.detail || body?.message || fallbackMessage);
};

export const fetchUnitsOfMeasure = async () => {
  const response = await fetch(`${API_BASE_URL}/uom`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch Units of Measure');
  return response.json();
};

export const correctMaterialCost = async (id, correction) => {
  const response = await fetch(`${API_BASE_URL}/raw-materials/${id}/cost`, {
    method: 'PATCH', headers: getHeaders(), body: JSON.stringify(correction),
  });
  if (!response.ok) return responseError(response, 'Could not correct material cost');
  return response.json();
};

export const createUnitOfMeasure = async (uom) => {
  const response = await fetch(`${API_BASE_URL}/uom`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(uom)
  });
  if (!response.ok) throw new Error('Failed to create Unit of Measure');
  return response.json();
};

export const updateUnitOfMeasure = async (id, uom) => {
  const response = await fetch(`${API_BASE_URL}/uom/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(uom)
  });
  if (!response.ok) throw new Error('Failed to update Unit of Measure');
  return response.json();
};

export const deleteUnitOfMeasure = async (id) => {
  const response = await fetch(`${API_BASE_URL}/uom/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete Unit of Measure');
};

export const fetchRawMaterials = async () => {
  const response = await fetch(`${API_BASE_URL}/raw-materials`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch Raw Materials');
  return response.json();
};

export const createRawMaterial = async (material) => {
  const response = await fetch(`${API_BASE_URL}/raw-materials`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(material)
  });
  if (!response.ok) await responseError(response, 'Failed to create Raw Material');
  return response.json();
};

export const updateRawMaterial = async (id, material) => {
  const response = await fetch(`${API_BASE_URL}/raw-materials/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(material)
  });
  if (!response.ok) throw new Error('Failed to update Raw Material');
  return response.json();
};

export const deleteRawMaterial = async (id) => {
  const response = await fetch(`${API_BASE_URL}/raw-materials/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
};

export const fetchCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/categories`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch Categories');
  return response.json();
};

export const createCategory = async (category) => {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(category)
  });
  if (!response.ok) throw new Error('Failed to create Category');
  return response.json();
};

export const updateCategory = async (id, category) => {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(category)
  });
  if (!response.ok) throw new Error('Failed to update Category');
  return response.json();
};

export const deleteCategory = async (id) => {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete Category');
};

export const createGoodsReceipt = async (receipt) => {
  const response = await fetch(`${API_BASE_URL}/goods-receipts`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(receipt) });
  if (!response.ok) throw new Error('Failed to receive goods');
  return response.json();
};

export const fetchGoodsReceipts = async () => {
  const response = await fetch(`${API_BASE_URL}/goods-receipts`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch goods receipts');
  return response.json();
};
