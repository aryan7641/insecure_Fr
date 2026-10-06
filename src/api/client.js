// API Client with Backend REST Integration, Automatic Token Handling, and Fallback
import * as mockData from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = {
  async get(url, config = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...config.headers
      };

      const response = await fetch(`${BASE_URL}${url}`, { headers });
      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
        }
        throw new Error(`HTTP Error ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.warn(`[API Get Fallback for ${url}]:`, err.message);
      return handleMockGet(url);
    }
  },

  async post(url, data, config = {}) {
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      
      const headers = {
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...getAuthHeaders(),
        ...config.headers
      };

      // Remove Content-Type if FormData to let browser generate boundary
      if (isFormData) {
        delete headers['Content-Type'];
        delete headers['content-type'];
      }

      const response = await fetch(`${BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: isFormData ? data : JSON.stringify(data)
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        if (response.status === 401) {
          handleUnauthorized();
        }
        const err = new Error(errorJson?.message || `HTTP Error ${response.status}`);
        err.response = { status: response.status, data: errorJson };
        throw err;
      }
      return await response.json();
    } catch (err) {
      console.error(`[API Post Error on ${url}]:`, err.message);
      throw err;
    }
  },

  async put(url, data, config = {}) {
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      
      const headers = {
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...getAuthHeaders(),
        ...config.headers
      };

      if (isFormData) {
        delete headers['Content-Type'];
        delete headers['content-type'];
      }

      const response = await fetch(`${BASE_URL}${url}`, {
        method: 'PUT',
        headers,
        body: isFormData ? data : JSON.stringify(data)
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        if (response.status === 401) {
          handleUnauthorized();
        }
        const err = new Error(errorJson?.message || `HTTP Error ${response.status}`);
        err.response = { status: response.status, data: errorJson };
        throw err;
      }
      return await response.json();
    } catch (err) {
      console.error(`[API Put Error on ${url}]:`, err.message);
      throw err;
    }
  },

  async delete(url, config = {}) {
    try {
      const headers = {
        ...getAuthHeaders(),
        ...config.headers
      };

      const response = await fetch(`${BASE_URL}${url}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        if (response.status === 401) {
          handleUnauthorized();
        }
        const err = new Error(errorJson?.message || `HTTP Error ${response.status}`);
        err.response = { status: response.status, data: errorJson };
        throw err;
      }
      return await response.json();
    } catch (err) {
      console.error(`[API Delete Error on ${url}]:`, err.message);
      throw err;
    }
  }
};

function getAuthHeaders() {
  const token = localStorage.getItem('insecure_token');
  const agencyId = localStorage.getItem('insecure_agency_id');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (agencyId) {
    headers['X-Agency-ID'] = agencyId;
  }
  return headers;
}

function handleUnauthorized() {
  const currentPath = window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/auth/callback') {
    localStorage.removeItem('insecure_token');
    window.location.href = '/login';
  }
}

function handleMockGet(url) {
  if (url.includes('/customers')) {
    return { status: 'success', data: { data: mockData.MOCK_CUSTOMERS, customers: mockData.MOCK_CUSTOMERS } };
  }
  if (url.includes('/insurance')) {
    return { status: 'success', data: mockData.MOCK_POLICIES };
  }
  if (url.includes('/mutual-funds')) {
    return { status: 'success', data: mockData.MOCK_MUTUAL_FUNDS };
  }
  if (url.includes('/sips')) {
    return { status: 'success', data: mockData.MOCK_SIPS };
  }
  if (url.includes('/followups')) {
    return { status: 'success', data: mockData.MOCK_FOLLOWUPS };
  }
  if (url.includes('/documents')) {
    return { status: 'success', data: mockData.MOCK_DOCUMENTS };
  }
  if (url.includes('/templates')) {
    return { status: 'success', data: mockData.MOCK_WHATSAPP_TEMPLATES };
  }
  if (url.includes('/activity')) {
    return { status: 'success', data: mockData.MOCK_ACTIVITY };
  }
  if (url.includes('/analytics')) {
    return {
      status: 'success',
      data: {
        totalCustomers: 3,
        activePolicies: 3,
        expiringPolicies: 2,
        totalSipAmount: 55000,
        totalPortfolioValue: 5670000,
        totalInvested: 4400000
      }
    };
  }
  return { status: 'success', data: [] };
}
