import axios from 'axios';
import { Platform } from 'react-native';

const BASE_URL = __DEV__ 
  ? (Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1')
  : 'https://trace-7h2o.onrender.com/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ─── Response/Error Interceptor for debugging ─────────────────────
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      const status = error.response?.status || 'NETWORK_ERROR';
      const url = error.config?.url || 'unknown';
      const method = error.config?.method?.toUpperCase() || '?';
      const message = error.response?.data?.message || error.message;
      console.error(`❌ ${method} ${url} → ${status}: ${message}`);
      if (error.response?.data) {
        console.error('   Response body:', JSON.stringify(error.response.data, null, 2));
      }
    }
    return Promise.reject(error);
  }
);

export const TraceApi = {
  // --- Auth ---
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  googleLogin: async (token: string) => {
    const response = await api.post('/auth/google', { token });
    return response.data;
  },

  signup: async (data: { email: string; password: string; name?: string }) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  getMe: async (token: string) => {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateProfile: async (token: string, data: any) => {
    const response = await api.put('/auth/me', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // --- Reports ---
  createReport: async (token: string, formData: FormData) => {
    const response = await api.post('/complaints', formData, {
      headers: { 
        Authorization: `Bearer ${token}`
      },
      transformRequest: (data) => data,
    });
    return response.data;
  },

  getReports: async (token: string, page = 1, pageSize = 20) => {
    const response = await api.get('/complaints', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  getReport: async (token: string, id: string) => {
    const response = await api.get(`/complaints/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getMapComplaints: async () => {
    const response = await api.get('/complaints/map');
    return response.data;
  },

  // --- Settings ---
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (token: string, data: any) => {
    const response = await api.put('/settings', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // --- Health ---
  health: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};
