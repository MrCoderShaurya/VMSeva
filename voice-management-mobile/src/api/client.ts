import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const client = axios.create({
  baseURL: 'http://10.228.76.26:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
    }
    console.log('API Error:', JSON.stringify({
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    }));
    return Promise.reject(error);
  }
);

export default client;
