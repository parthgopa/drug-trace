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
  role: 'owner' | 'manufacturer' | 'distributor' | 'retailer' | 'customer' | 'admin';
  company_name?: string;
  license_number?: string;
  address?: string;
  is_active?: boolean;
  invited_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface Invitation {
  _id: string;
  email: string;
  role: 'manufacturer' | 'distributor' | 'retailer';
  invited_by: string;
  company_name?: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  accepted_at?: string;
}

export interface InvitationCheck {
  success: boolean;
  has_account: boolean;
  has_invitation: boolean;
  invitation?: Invitation;
  message: string;
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
    coordinates?: {
      latitude: number;
      longitude: number;
    };
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
  drug_info?: {
    drug_name: string;
    batch_number: string;
    manufacturer?: string;
    expiry_date?: string;
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
    role: 'customer' | 'manufacturer' | 'owner';
    company_name?: string;
    license_number?: string;
    address?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  checkInvitation: async (email: string) => {
    const response = await api.post('/auth/check-invitation', { email });
    return response.data;
  },

  setupPassword: async (data: {
    email: string;
    password: string;
    name: string;
    company_name?: string;
    license_number?: string;
    address?: string;
  }) => {
    const response = await api.post('/auth/setup-password', data);
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

export const ownerAPI = {
  sendInvitation: async (data: {
    email: string;
    role: 'manufacturer' | 'distributor' | 'retailer';
    company_name?: string;
  }) => {
    const response = await api.post('/owner/invite', data);
    return response.data;
  },

  getInvitations: async (status?: string, page: number = 1, limit: number = 20) => {
    const response = await api.get('/owner/invitations', {
      params: { status, page, limit },
    });
    return response.data;
  },

  deleteInvitation: async (invitationId: string) => {
    const response = await api.delete(`/owner/invitations/${invitationId}`);
    return response.data;
  },

  getUsers: async (role?: string, page: number = 1, limit: number = 20) => {
    const response = await api.get('/owner/users', {
      params: { role, page, limit },
    });
    return response.data;
  },

  activateUser: async (userId: string) => {
    const response = await api.post(`/owner/users/${userId}/activate`);
    return response.data;
  },

  deactivateUser: async (userId: string) => {
    const response = await api.post(`/owner/users/${userId}/deactivate`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/owner/statistics');
    return response.data;
  },
};

export const distributorAPI = {
  inviteRetailer: async (data: {
    email: string;
    company_name?: string;
  }) => {
    const response = await api.post('/distributor/invite-retailer', data);
    return response.data;
  },

  getInvitations: async () => {
    const response = await api.get('/distributor/invitations');
    return response.data;
  },

  deleteInvitation: async (invitationId: string) => {
    const response = await api.delete(`/distributor/invitations/${invitationId}`);
    return response.data;
  },
};

export const supplyChainAPI = {
  // Manufacturer scan
  manufacturerScan: async (data: {
    serial_number: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    notes?: string;
  }) => {
    const response = await api.post('/supply-chain/manufacturer/scan', data);
    return response.data;
  },

  getManufacturerScans: async (limit: number = 100) => {
    const response = await api.get('/supply-chain/manufacturer/scans', {
      params: { limit },
    });
    return response.data;
  },

  // Distributor scan
  distributorScan: async (data: {
    serial_number: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    notes?: string;
  }) => {
    const response = await api.post('/supply-chain/distributor/scan', data);
    return response.data;
  },

  getDistributorScans: async (limit: number = 100) => {
    const response = await api.get('/supply-chain/distributor/scans', {
      params: { limit },
    });
    return response.data;
  },

  // Retailer scan
  retailerScan: async (data: {
    serial_number: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    notes?: string;
  }) => {
    const response = await api.post('/supply-chain/retailer/scan', data);
    return response.data;
  },

  getRetailerScans: async (limit: number = 100) => {
    const response = await api.get('/supply-chain/retailer/scans', {
      params: { limit },
    });
    return response.data;
  },

  // Common endpoints
  getProductJourney: async (serialNumber: string) => {
    const response = await api.get(`/supply-chain/product/journey/${serialNumber}`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/supply-chain/statistics');
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
