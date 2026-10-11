import api from './api';

const API_BASE_URL = '/admin/auth/users'; // api.js already prepends /api

export const fetchUsers = async () => {
  const response = await api.get(API_BASE_URL);
  return response.data;
};

export const fetchRoles = async () => {
  const response = await api.get(`/admin/auth/roles`);
  return response.data;
};

export const fetchPermissions = async () => {
  const response = await api.get(`/admin/auth/permissions`);
  return response.data;
};

export const createRole = async (roleData) => {
  const response = await api.post(`/admin/auth/roles`, roleData);
  return response.data;
};

export const updateRole = async (roleId, roleData) => {
  const response = await api.put(`/admin/auth/roles/${roleId}`, roleData);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post(API_BASE_URL, userData);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`${API_BASE_URL}/${userId}`, userData);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.post(`/admin/auth/change-password`, data);
  return response.data;
};

export const toggleUserStatus = async (userId) => {
  const response = await api.put(`${API_BASE_URL}/${userId}/toggle-status`);
  return response.data;
};

export const fetchConfigs = async () => {
  const response = await api.get('/admin/configs');
  return response.data;
};

export const updateConfig = async (key, configValue) => {
  const response = await api.put(`/admin/configs/${key}`, { configValue });
  return response.data;
};

// Tenant APIs
export const fetchTenants = async () => {
  const response = await api.get('/admin/tenants');
  return response.data;
};

export const fetchTenantById = async (tenantId) => {
  const response = await api.get(`/admin/tenants/${tenantId}`);
  return response.data;
};

export const createTenant = async (tenantData) => {
  const response = await api.post('/admin/tenants', tenantData);
  return response.data;
};

export const updateTenant = async (tenantId, tenantData) => {
  const response = await api.put(`/admin/tenants/${tenantId}`, tenantData);
  return response.data;
};

export const toggleTenantStatus = async (tenantId) => {
  const response = await api.put(`/admin/tenants/${tenantId}/toggle-status`);
  return response.data;
};
