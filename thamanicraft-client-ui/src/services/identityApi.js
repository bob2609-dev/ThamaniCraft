import Cookies from 'js-cookie';

const API_BASE_URL = '/api/auth/users';

const getHeaders = () => {
  const token = Cookies.get('tenant_token') || localStorage.getItem('tenant_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const fetchUsers = async () => {
  const response = await fetch(API_BASE_URL, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const fetchRoles = async () => {
  const response = await fetch(`${API_BASE_URL}/roles`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch roles');
  return response.json();
};

export const fetchPermissions = async () => {
  const response = await fetch(`${API_BASE_URL}/permissions`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch permissions');
  return response.json();
};

export const createRole = async (roleData) => {
  const response = await fetch(`${API_BASE_URL}/roles`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(roleData)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.detail || 'Failed to create role');
  }
  return response.json();
};

export const createUser = async (userData) => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.detail || 'Failed to create user');
  }
  return response.json();
};

export const changePassword = async (data) => {
  const response = await fetch(`${API_BASE_URL}/change-password`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.detail || 'Failed to change password');
  }
};

export const toggleUserStatus = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/${userId}/toggle-status`, {
    method: 'PUT',
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.detail || 'Failed to toggle user status');
  }
};
