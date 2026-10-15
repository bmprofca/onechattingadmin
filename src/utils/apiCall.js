import toast from 'react-hot-toast';
import { API_BASE, UPLOAD_API_URL, UPLOAD_API_KEY } from './config';
import { PLAIN_PAYLOAD_KEY, isPlainObject, toApiError } from '../api/http/contract';
import { toCompatibleBody } from '../api/http/transport';

export const handleApiError = (error, fallbackMessage = null) => {
  const message =
    fallbackMessage ||
    error?.response?.data?.message ||
    error?.message ||
    'Network error or server unreachable';

  toast.error(message);
};

/**
 * Unified API calling utility
 * @param {string} endpoint - The API endpoint or full URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object|null} body - Request payload
 * @param {Object} customHeaders - Additional request headers (for legacy endpoints)
 * @returns {Promise<Response>} - The fetch response object
 */
export const apiCall = async (endpoint, method = 'GET', body = null, customHeaders = {}) => {
  const userDataStr = localStorage.getItem('user_data');
  let token = null;
  let username = null;
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      token = userData.token;
      username = userData.username;
    } catch (e) {
      console.error("Failed to parse user_data from local storage", e);
    }
  }

  const headers = { ...customHeaders };
  delete headers['x-token'];
  delete headers['x-auth-token'];
  delete headers.token;

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Send token as Authorization Bearer header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    if (body instanceof FormData) {
      options.body = body;
    } else if (typeof body === 'string') {
      let parsed = null;
      try { parsed = JSON.parse(body); } catch { parsed = null; }
      options.body = isPlainObject(parsed) && parsed.key === PLAIN_PAYLOAD_KEY ? JSON.stringify(parsed.data ?? {}) : body;
    } else if (isPlainObject(body) && body.key === PLAIN_PAYLOAD_KEY) {
      options.body = JSON.stringify(body.data ?? {});
    } else {
      options.body = JSON.stringify(body);
    }
  }

  // Handle absolute vs relative URLs
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  if (!API_BASE && !endpoint.startsWith('http')) {
    console.error(
      'REACT_APP_BASE_API_URL is not set. Add it to .env.development or .env.production and restart the dev server.',
    );
  }

  try {
    const response = await fetch(url, options);

    // Global 401 Unauthorized handler
    if (response.status === 401) {
      localStorage.removeItem('user_data');

      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Screens read error/msg/data; expand the API envelope for them.
    const readJson = response.json.bind(response);
    response.json = async () => toCompatibleBody(await readJson());
    response.envelope = readJson;
    return response;
  } catch (error) {
    console.error(`API Call Error (${url}):`, error);
    throw error;
  }
};

/**
 * Resolves with { success, message, data, meta }.
 * Throws ApiError { status, code, message, details } on failure.
 */
export const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const response = await apiCall(endpoint, method, body);
  const envelope = await response.envelope().catch(() => null);
  if (!response.ok || !envelope || envelope.success === false) {
    throw toApiError({ response: { status: response.status, data: envelope, headers: { 'x-request-id': response.headers.get('X-Request-Id') } } });
  }
  return envelope;
};


/**
 * Common file upload utility
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The URL of the uploaded file
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(UPLOAD_API_URL, {
    method: 'POST',
    headers: {
      key: UPLOAD_API_KEY,
    },
    body: formData
  });

  const result = await response.json();
  if (result.success && result.url) {
    return result.url;
  }
  throw new Error(result.message || 'Upload failed');
};

export default apiCall;
