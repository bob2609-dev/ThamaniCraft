import api from './api';

export const fetchGlobalUOMs = async () => {
  const response = await api.get('/admin/uom');
  return response.data;
};

export const createGlobalUOM = async (uomData) => {
  const response = await api.post('/admin/uom', uomData);
  return response.data;
};

export const updateGlobalUOM = async (id, uomData) => {
  const response = await api.put(`/admin/uom/${id}`, uomData);
  return response.data;
};

export const deleteGlobalUOM = async (id) => {
  const response = await api.delete(`/admin/uom/${id}`);
  return response.data;
};
