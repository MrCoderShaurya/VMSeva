import axios from 'axios';

// IMPORTANT: For physical mobile devices running Expo Go, replace "localhost" 
// with your computer's local IP address (e.g., "192.168.1.X").
// If you are using Android Emulator, use "10.0.2.2".
export const API_BASE_URL = 'http://10.73.45.26:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Helper to set authorization token in header
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/status`),
  getRoles: (id) => api.get(`/users/${id}/roles`),
  assignRole: (id, role_id) => api.post(`/users/${id}/roles`, { role_id }),
  removeRole: (id, roleId) => api.delete(`/users/${id}/roles/${roleId}`),
  assignModule: (id, module) => api.put(`/users/${id}/module`, { module }),
};

export const modulesAPI = {
  getAll: () => api.get('/admin/modules'),
  create: (data) => api.post('/admin/modules', data),
  toggleStatus: (id) => api.patch(`/admin/modules/${id}/status`),
  delete: (id) => api.delete(`/admin/modules/${id}`),
};

export default api;
