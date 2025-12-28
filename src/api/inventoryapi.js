import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

// API Configuration
const API_CONFIG = {
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const token = getAuthToken();

  console.log('Inventory API Request:', { url, token: token ? 'Present' : 'Missing', options });

  const config = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`InventoryAPI Error for ${endpoint}:`, error);
    throw error;
  }
};

// Inventory API
const inventoryAPI = {
  // Categories
  getCategories: async (includeArchived = false) => {
    const params = new URLSearchParams();
    if (includeArchived) params.append('include_archived', 'true');
    const endpoint = params.toString() ? `/inventory/categories?${params}` : '/inventory/categories';
    return apiRequest(endpoint);
  },

  createCategory: async (data) => {
    return apiRequest('/inventory/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCategory: async (id, data) => {
    return apiRequest(`/inventory/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCategory: async (id) => {
    return apiRequest(`/inventory/categories/${id}`, {
      method: 'DELETE',
    });
  },

  restoreCategory: async (id) => {
    // Note: You may need to add this endpoint to your backend
    // or use a different approach for category restoration
    return apiRequest(`/inventory/categories/${id}/restore`, {
      method: 'POST',
    });
  },

  // Items
  getItems: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '' && filters[key] !== 'all_items' && filters[key] !== 'all') {
        params.append(key, filters[key]);
      }
    });
    const endpoint = params.toString() ? `/inventory/items?${params}` : '/inventory/items';
    return apiRequest(endpoint);
  },

  getItem: async (id) => {
    return apiRequest(`/inventory/items/${id}`);
  },

  createItem: async (data) => {
    return apiRequest('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateItem: async (id, data) => {
    return apiRequest(`/inventory/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteItem: async (id) => {
    return apiRequest(`/inventory/items/${id}`, {
      method: 'DELETE',
    });
  },

  restoreItem: async (id) => {
    return apiRequest(`/inventory/items/${id}/restore`, {
      method: 'POST',
    });
  },

  // Transactions
  getTransactions: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '' && filters[key] !== 'all_items' && filters[key] !== 'all') {
        params.append(key, filters[key]);
      }
    });
    const endpoint = params.toString() ? `/inventory/transactions?${params}` : '/inventory/transactions';
    return apiRequest(endpoint);
  },

  createTransaction: async (data) => {
    return apiRequest('/inventory/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Dashboard
  getDashboard: async () => {
    return apiRequest('/inventory/dashboard');
  },

  getLowStockItems: async () => {
    return apiRequest('/inventory/low-stock');
  },

  // Batches
  getBatchesByItem: async (itemId) => {
    return apiRequest(`/inventory/batches/item/${itemId}`);
  },

  getExpiryAlerts: async (days = 30) => {
    return apiRequest(`/inventory/batches/expiry-alerts?days=${days}`);
  },

  adjustBatch: async (batchId, data) => {
    return apiRequest(`/inventory/batches/${batchId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  markBatchExpired: async (batchId) => {
    return apiRequest(`/inventory/batches/${batchId}/expire`, {
      method: 'POST',
    });
  },

  // Stock Operations with Batch Support
  stockInWithBatch: async (data) => {
    return apiRequest('/inventory/stock/in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  stockOutFEFO: async (data) => {
    return apiRequest('/inventory/stock/out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Bulk Import
  bulkImportItems: async (items) => {
    return apiRequest('/inventory/items/import', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  // Medication Search
  searchMedications: async (query, limit = 10) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (limit) params.append('limit', limit.toString());
    const endpoint = `/inventory/medications/search?${params}`;
    return apiRequest(endpoint);
  },
};

export default inventoryAPI;