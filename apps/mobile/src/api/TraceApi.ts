import axios from 'axios';
import { Platform } from 'react-native';

// Set to true to always connect to the live Render cloud backend
// (Required for physical phones, since 10.0.2.2 only works inside local Android emulators)
export const USE_RENDER_BACKEND = true;

const LIVE_RENDER_URL = 'https://trace-7h2o.onrender.com/api/v1';
const LOCAL_DEV_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/api/v1'
    : 'http://localhost:4000/api/v1';

export const BASE_URL = USE_RENDER_BACKEND
  ? LIVE_RENDER_URL
  : __DEV__
  ? LOCAL_DEV_URL
  : LIVE_RENDER_URL;

export const getFullImageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('file://') ||
    url.startsWith('content://')
  ) {
    return url;
  }
  const host = USE_RENDER_BACKEND
    ? 'https://trace-7h2o.onrender.com'
    : Platform.OS === 'android'
    ? 'http://10.0.2.2:4000'
    : 'http://localhost:4000';
  return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000, // 45 seconds to accommodate Render free-tier cold starts
});

// ─── Response/Error Interceptor for debugging ─────────────────────
api.interceptors.response.use(
  response => {
    if (__DEV__) {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url} → ${
          response.status
        }`,
      );
    }
    return response;
  },
  error => {
    if (__DEV__) {
      const status = error.response?.status || 'NETWORK_ERROR';
      const url = error.config?.url || 'unknown';
      const method = error.config?.method?.toUpperCase() || '?';
      const message = error.response?.data?.message || error.message;
      console.error(`❌ ${method} ${url} → ${status}: ${message}`);
      if (error.response?.data) {
        console.error(
          '   Response body:',
          JSON.stringify(error.response.data, null, 2),
        );
      }
    }
    return Promise.reject(error);
  },
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
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateProfile: async (token: string, data: any) => {
    const response = await api.put('/auth/me', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // --- Reports ---
  createReport: async (token: string, formData: FormData) => {
    // In React Native on Android, native fetch() handles multipart/form-data
    // streams with automatic boundary generation seamlessly via OkHttp.
    try {
      const response = await fetch(`${BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(
          data?.message || `Server returned error (${response.status})`,
        );
      }
      return data;
    } catch (fetchError: any) {
      // If fetch fails or encounters a network issue, try via axios client
      console.warn('Fetch createReport failed, falling back to axios:', fetchError.message);
      const axiosRes = await api.post('/complaints', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        transformRequest: data => data,
      });
      return axiosRes.data;
    }
  },

  getReports: async (token: string, page = 1, pageSize = 20) => {
    const response = await api.get('/complaints', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  getReport: async (token: string, id: string) => {
    const response = await api.get(`/complaints/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // --- Health ---
  health: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};
