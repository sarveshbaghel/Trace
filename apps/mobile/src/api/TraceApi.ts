import axios from 'axios';

const BASE_URL = 'https://trace-7h2o.onrender.com/api/v1'; // Live Render backend URL

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const TraceApi = {
  // --- Auth ---
  login: async (data: any) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  signup: async (data: any) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  getMe: async (token: string) => {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // --- Reports ---
  createReport: async (token: string, formData: FormData) => {
    const response = await api.post('/report', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },

  getReports: async (token: string, page = 1, pageSize = 20) => {
    const response = await api.get('/reports', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  getReport: async (token: string, id: string) => {
    const response = await api.get(`/reports/${id}`, {
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
