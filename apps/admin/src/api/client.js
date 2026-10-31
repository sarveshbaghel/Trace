import axios from 'axios';

// In dev, Vite proxy forwards /api to localhost:4000
// In prod, set VITE_API_URL to your deployed API
export const API_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Add auth token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('trace_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('trace_admin_token');
      localStorage.removeItem('trace_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Auth API ---
export const loginAdmin = async (email, password) => {
  const { data } = await client.post('/api/v1/admin/login', { email, password });
  return data;
};

// --- Reports / Complaints API ---
export const getComplaints = async (params = {}) => {
  const { data } = await client.get('/api/v1/admin/complaints', { params });
  return data;
};

export const getComplaint = async (id) => {
  const { data } = await client.get(`/api/v1/admin/complaints/${id}`);
  return data;
};

export const updateComplaintStatus = async (id, status, adminNote) => {
  const { data } = await client.patch(`/api/v1/admin/complaints/${id}/status`, { status, admin_note: adminNote });
  return data;
};

export const escalateComplaint = async (id) => {
  const { data } = await client.post(`/api/v1/admin/complaints/${id}/escalate`);
  return data;
};

export const resolveComplaint = async (id, formData) => {
  const { data } = await client.post(`/api/v1/admin/complaints/${id}/resolve`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const declineComplaint = async (id, declineReason) => {
  const { data } = await client.post(`/api/v1/admin/complaints/${id}/decline`, { decline_reason: declineReason });
  return data;
};

export const postToX = async (id) => {
  const { data } = await client.post(`/api/v1/admin/complaints/${id}/post-to-x`);
  return data;
};

export const getMetrics = async () => {
  const { data } = await client.get('/api/v1/admin/metrics');
  return data;
};

// --- Settings API ---
export const getSettings = async () => {
  const { data } = await client.get('/api/v1/admin/settings');
  return data;
};

export const updateSettings = async (updates) => {
  const { data } = await client.put('/api/v1/admin/settings', updates);
  return data;
};

// --- Aliases for compatibility ---
export const getReports = getComplaints;
export const getReport = getComplaint;
export const updateReport = updateComplaintStatus;
export const resolveReport = resolveComplaint;
export const declineReport = declineComplaint;

// --- Utilities ---
export const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

export default client;
