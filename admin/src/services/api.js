import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8001';
const API_BASE_URL = 'http://72.62.79.188:1500';


// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

// ==================== ADMIN API ====================
export const adminAPI = {
  // Dashboard Stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Users Management
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getUserDetails: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  activateUser: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/activate`);
    return response.data;
  },

  deactivateUser: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/deactivate`);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  createOwner: async (ownerData) => {
    const response = await api.post('/admin/users/create-owner', ownerData);
    return response.data;
  },

  // Owners Management
  getAllOwners: async (page = 1, limit = 50) => {
    const response = await api.get('/admin/owners', { params: { page, limit } });
    return response.data;
  },

  getOwnerUsers: async (ownerId) => {
    const response = await api.get(`/admin/owners/${ownerId}/users`);
    return response.data;
  },

  // Customers Management
  getAllCustomers: async (page = 1, limit = 50) => {
    const response = await api.get('/admin/customers', { params: { page, limit } });
    return response.data;
  },

  getCustomerScans: async (customerId, page = 1, limit = 50) => {
    const response = await api.get(`/admin/customers/${customerId}/scans`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Drugs Management
  getAllDrugs: async (page = 1, limit = 50) => {
    const response = await api.get('/admin/drugs', { params: { page, limit } });
    return response.data;
  },

  getDrugDetails: async (drugId) => {
    const response = await api.get(`/admin/drugs/${drugId}`);
    return response.data;
  },

  updateDrug: async (drugId, updateData) => {
    const response = await api.patch(`/admin/drugs/${drugId}`, updateData);
    return response.data;
  },

  deleteDrug: async (drugId) => {
    const response = await api.delete(`/admin/drugs/${drugId}`);
    return response.data;
  },

  // Reports Management
  getAllReports: async (page = 1, limit = 100) => {
    const response = await api.get('/admin/reports', { params: { page, limit } });
    return response.data;
  },

  updateReportStatus: async (reportId, status, adminNotes = null) => {
    const response = await api.put(`/admin/report/${reportId}/status`, {
      status,
      admin_notes: adminNotes,
    });
    return response.data;
  },

  deleteReport: async (reportId) => {
    const response = await api.delete(`/admin/reports/${reportId}`);
    return response.data;
  },

  // Invitations Management
  getAllInvitations: async (page = 1, limit = 50, status = null) => {
    const params = { page, limit };
    if (status) params.status = status;
    const response = await api.get('/admin/invitations', { params });
    return response.data;
  },

  deleteInvitation: async (invitationId) => {
    const response = await api.delete(`/admin/invitations/${invitationId}`);
    return response.data;
  },

  // Scans
  getAllScans: async (page = 1, limit = 100) => {
    const response = await api.get('/admin/scans', { params: { page, limit } });
    return response.data;
  },
};

export default api;
