// API Client with Backend REST Integration and Fallback Dataset
import * as mockData from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = {
  async get(url, config = {}) {
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('insecure_token') || ''}`,
          'X-Agency-ID': localStorage.getItem('insecure_agency_id') || 'agency-1',
          ...config.headers
        }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn(`API Authorization error ${response.status} on ${url}`);
        }
        throw new Error(`HTTP Error ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.info(`[API Fallback] Using mock dataset for GET ${url}`);
      return handleMockGet(url);
    }
  },

  async post(url, data, config = {}) {
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('insecure_token') || ''}`,
          'X-Agency-ID': localStorage.getItem('insecure_agency_id') || 'agency-1',
          ...config.headers
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.info(`[API Fallback] Using mock response for POST ${url}`);
      return { success: true, data: { id: `generated-${Date.now()}`, ...data } };
    }
  },

  async put(url, data, config = {}) {
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('insecure_token') || ''}`,
          'X-Agency-ID': localStorage.getItem('insecure_agency_id') || 'agency-1',
          ...config.headers
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.info(`[API Fallback] Using mock response for PUT ${url}`);
      return { success: true, data };
    }
  },

  async delete(url, config = {}) {
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('insecure_token') || ''}`,
          'X-Agency-ID': localStorage.getItem('insecure_agency_id') || 'agency-1',
          ...config.headers
        }
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.info(`[API Fallback] Using mock response for DELETE ${url}`);
      return { success: true };
    }
  }
};

function handleMockGet(url) {
  if (url.includes('/customers')) {
    return { status: 'success', data: mockData.MOCK_CUSTOMERS };
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
