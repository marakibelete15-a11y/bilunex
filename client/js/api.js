/**
 * Bilunex - API Client (ES Module)
 * Centralized fetch wrapper communicating with the Express backend under /api/v1/
 * Includes timeout handling, JSON normalization, and a standardized error shape.
 */

const API_BASE = '/api/v1';
const DEFAULT_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor({ status = 0, message = 'An error occurred', errors = null }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export const api = {
  /**
   * Generic request helper with automatic timeout and normalized error formatting
   * @param {string} endpoint - API path (e.g. '/public/parent-registrations')
   * @param {object} options - Fetch options (method, headers, body, timeoutMs)
   * @returns {Promise<any>}
   */
  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${cleanEndpoint}`;

    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = { ...options.headers };
    if (!isFormData && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

    // Attach Bearer token from localStorage if user session exists
    const token = localStorage.getItem('bilunex_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
      signal: controller.signal,
    };

    if (config.body && typeof config.body === 'object' && !isFormData) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (options.expectedStatus && response.status !== options.expectedStatus) {
        throw new ApiError({
          status: response.status,
          message:
            data.message || `Expected HTTP ${options.expectedStatus}, received ${response.status}.`,
          errors: Array.isArray(data.errors) ? data.errors : null,
        });
      }

      if (!response.ok) {
        let fallbackMessage = `Request failed with status ${response.status}`;
        if (response.status === 429) {
          fallbackMessage = 'Too many requests. Please wait a few moments before trying again.';
        } else if (response.status >= 500) {
          fallbackMessage = 'Server error. Our team has been notified. Please try again later.';
        }

        throw new ApiError({
          status: response.status,
          message: data.message || fallbackMessage,
          errors: Array.isArray(data.errors) ? data.errors : null,
        });
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new ApiError({
          status: 408,
          message: 'Request timed out. Please check your connection and try again.',
          errors: null,
        });
      }

      // Network unreachable or server offline
      throw new ApiError({
        status: 0,
        message:
          'Unable to connect to the server. Please verify your connection or try again shortly.',
        errors: null,
      });
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

// Global fallback for scripts that don't import modules
if (typeof window !== 'undefined') {
  window.apiClient = api;
}
