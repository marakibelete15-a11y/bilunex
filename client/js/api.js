/**
 * Bilunex - API Client
 * Centralized fetch wrapper communicating with the Express backend under /api/v1/
 */

const API_BASE = '/api/v1';

const apiClient = {
  /**
   * Generic request helper with automatic headers and error handling
   * @param {string} endpoint - API endpoint (e.g. '/parents/register' or '/admin/applications')
   * @param {object} options - Fetch options (method, headers, body)
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Attach Bearer token from localStorage if user is authenticated
    const token = localStorage.getItem('bilunex_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.errors = data.errors || null;
        throw error;
      }

      return data;
    } catch (err) {
      // Re-throw formatted error for caller to handle
      throw err;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  },

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};

// Expose globally for vanilla browser scripts
window.apiClient = apiClient;
