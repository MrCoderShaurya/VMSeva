import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
