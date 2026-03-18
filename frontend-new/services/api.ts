import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.31.55:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'manufacturer' | 'admin';
  company_name?: string;
  license_number?: string;
  address?: string;
  created_at: string;
}

export interface Drug {
  _id: string;
  drug_name: string;
  manufacturer: string;
  manufacturer_id: string;
  batch_number: string;
  serial_number: string;
  qr_code: string;
  expiry_date: string;
  manufacturing_date: string;
  description?: string;
  status: 'active' | 'recalled';
  created_at: string;
  updated_at: string;
}

export interface ScanResult {
  is_genuine: boolean;
  status: 'genuine' | 'fake' | 'expired' | 'recalled';
  message: string;
  color: string;
}

export interface ScanLog {
  _id: string;
  user_id: string;
  serial_number: string;
  scan_result: ScanResult;
  drug_info?: Drug;
  scanned_at: string;
}

export interface Report {
  _id: string;
  user_id: string;
  serial_number: string;
  issue_description: string;
  issue_type: string;
  status: 'pending' | 'resolved';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  _id: string;
  drug_name: string;
  manufacturer: string;
  quantity: number;
  status: 'active' | 'recalled' | 'voided' | 'deleted';
  expiry_date: string;
  manufacturing_date: string;
  created_at: string;
}

export interface ManufacturerStats {
  total_drugs: number;
  total_batches: number;
  active_batches: number;
  recalled_batches: number;
  voided_batches: number;
  total_scans: number;
  genuine_scans: number;
  fake_scans: number;
  suspicious_scans: number;
}

export interface ScanLocation {
  _id: string;
  serial_number: string;
  scanned_by_id: string;
  scanned_by_role: string;
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  scan_type: string;
  notes?: string;
  scanned_at: string;
  scanned_by?: {
    _id: string;
    name: string;
    company_name?: string;
    email: string;
    role: string;
  };
}

export interface ProductJourney {
  drug: Drug;
  journey: ScanLocation[];
  total_scans: number;
}

export const authAPI = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: 'customer' | 'manufacturer';
    company_name?: string;
    license_number?: string;
    address?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify-token');
    return response.data;
  },
};

export const customerAPI = {
  verifyDrug: async (serialNumber: string) => {
    const response = await api.get(`/customer/verify/${serialNumber}`);
    return response.data;
  },

  getScanHistory: async (page: number = 1, limit: number = 50) => {
    const response = await api.get('/customer/history', {
      params: { page, limit },
    });
    return response.data;
  },

  submitReport: async (data: {
    serial_number: string;
    issue_description: string;
    issue_type: string;
  }) => {
    const response = await api.post('/customer/report', data);
    return response.data;
  },

  getUserReports: async (page: number = 1, limit: number = 50) => {
    const response = await api.get('/customer/reports', {
      params: { page, limit },
    });
    return response.data;
  },

  getProductJourney: async (serialNumber: string) => {
    const response = await api.get(`/customer/product/journey/${serialNumber}`);
    return response.data;
  },
};

export const manufacturerAPI = {
  generateDrugs: async (data: {
    drug_name: string;
    batch_number: string;
    quantity: number;
    expiry_date: string;
    manufacturing_date: string;
    description?: string;
  }) => {
    const response = await api.post('/manufacturer/drug/generate', data);
    return response.data;
  },

  getDrugs: async (page: number = 1, limit: number = 50) => {
    const response = await api.get('/manufacturer/drugs', {
      params: { page, limit },
    });
    return response.data;
  },

  getBatches: async () => {
    const response = await api.get('/manufacturer/batches');
    return response.data;
  },

  recallBatch: async (batch_number: string, reason: string) => {
    const response = await api.post('/manufacturer/recall', {
      batch_number,
      reason,
    });
    return response.data;
  },

  getBatchQRCodes: async (batchNumber: string) => {
    const response = await api.get(`/manufacturer/batch/${batchNumber}/qr-codes`);
    return response.data;
  },

  getBatchDetails: async (batchNumber: string) => {
    const response = await api.get(`/manufacturer/batch/${batchNumber}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/manufacturer/stats');
    return response.data;
  },

  exportBatch: async (batchNumber: string, format: 'pdf' | 'csv') => {
    const response = await api.get(`/manufacturer/batch/${batchNumber}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response;
  },

  voidBatch: async (batchNumber: string) => {
    const response = await api.post(`/manufacturer/batch/${batchNumber}/void`);
    return response.data;
  },

  duplicateBatch: async (batchNumber: string, data: {
    new_batch_number: string;
    drug_name?: string;
    expiry_date?: string;
    manufacturing_date?: string;
    description?: string;
  }) => {
    const response = await api.post(`/manufacturer/batch/${batchNumber}/duplicate`, data);
    return response.data;
  },

  softDeleteBatch: async (batchNumber: string) => {
    const response = await api.delete(`/manufacturer/batch/${batchNumber}`);
    return response.data;
  },

  recordScan: async (data: {
    serial_number: string;
    scan_type: string;
    location?: {
      latitude?: number;
      longitude?: number;
      address?: string;
    };
    notes?: string;
  }) => {
    const response = await api.post('/manufacturer/scan/record', data);
    return response.data;
  },

  getScanAnalytics: async () => {
    const response = await api.get('/manufacturer/analytics/scans');
    return response.data;
  },

  getRecentScans: async (limit: number = 50) => {
    const response = await api.get('/manufacturer/scans/recent', {
      params: { limit },
    });
    return response.data;
  },

  getReports: async (page: number = 1, limit: number = 20, status?: string) => {
    const response = await api.get('/manufacturer/reports', {
      params: { page, limit, status },
    });
    return response.data;
  },

  getReportStatistics: async () => {
    const response = await api.get('/manufacturer/reports/statistics');
    return response.data;
  },

  updateReportStatus: async (reportId: string, status: string, adminNotes?: string) => {
    const response = await api.put(`/manufacturer/reports/${reportId}/status`, {
      status,
      admin_notes: adminNotes,
    });
    return response.data;
  },
};

export const storageAPI = {
  saveAuthData: async (token: string, role: string, user: User) => {
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userRole', role);
    await AsyncStorage.setItem('userData', JSON.stringify(user));
  },

  getAuthData: async () => {
    const token = await AsyncStorage.getItem('authToken');
    const role = await AsyncStorage.getItem('userRole');
    const userData = await AsyncStorage.getItem('userData');
    return {
      token,
      role,
      user: userData ? JSON.parse(userData) : null,
    };
  },

  clearAuthData: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userData');
  },
};

export default api;
