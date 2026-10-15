import axios, { AxiosHeaders } from 'axios';
import { API_BASE_URL } from '../../config/api';
import {
  PLAIN_PAYLOAD_KEY,
  isPlainObject,
  isApiEnvelope,
  toScreenBody,
  toScreenErrorBody,
} from './contract';

/** Admin session token saved by the login flow. */
export function getAdminToken() {
  try {
    const raw = localStorage.getItem('user_data') || localStorage.getItem('userData') || sessionStorage.getItem('userData');
    return raw ? JSON.parse(raw)?.token || '' : '';
  } catch {
    return '';
  }
}

const API_ORIGINS = [API_BASE_URL, (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '')].filter(Boolean);
const isApiUrl = (url) => API_ORIGINS.some((origin) => String(url || '').startsWith(origin));

function toPlainBody(data) {
  if (typeof FormData !== 'undefined' && data instanceof FormData) return data;
  let parsed = data;
  if (typeof data === 'string') {
    try { parsed = JSON.parse(data); } catch { return data; }
  }
  if (isPlainObject(parsed) && parsed.key === PLAIN_PAYLOAD_KEY) return parsed.data ?? {};
  return data;
}

/** Request side of the API contract: Bearer auth and a plain JSON body. */
export function applyApiRequest(config) {
  if (!isApiUrl(config?.url) && !isApiUrl(config?.baseURL)) return config;
  const headers = AxiosHeaders.from(config.headers || {});
  const headerToken = headers.get('x-token') || headers.get('x-auth-token') || headers.get('token');
  const token = (typeof headerToken === 'string' && headerToken) || getAdminToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  ['x-token', 'x-auth-token', 'token', 'username'].forEach((name) => headers.delete(name));
  if (config.data !== undefined) config.data = toPlainBody(config.data);
  config.headers = headers;
  return config;
}

/** Expand an API envelope into the body shape existing admin screens read. */
export function toCompatibleBody(body) {
  if (!isApiEnvelope(body)) return body;
  return body.success ? toScreenBody(body) : toScreenErrorBody(body);
}

function handleUnauthorized(status) {
  if (status === 401) {
    localStorage.removeItem('user_data');
    if (window.location.pathname !== '/login') window.location.href = '/login';
  }
}

let installed = false;
export function installDefaultTransport() {
  if (installed) return;
  installed = true;
  axios.interceptors.request.use(applyApiRequest);
  axios.interceptors.response.use(
    (response) => {
      if (isApiUrl(response.config?.url) && !response.config?.apiNative) {
        response.apiEnvelope = response.data;
        response.data = toCompatibleBody(response.data);
      }
      return response;
    },
    (error) => {
      const response = error?.response;
      if (response && isApiUrl(error.config?.url) && !error.config?.apiNative) {
        handleUnauthorized(response.status);
        if (isApiEnvelope(response.data)) {
          response.apiEnvelope = response.data;
          response.data = toScreenErrorBody(response.data);
        }
      }
      // Admin screens already handle non-2xx with try/catch, so errors still reject.
      return Promise.reject(error);
    }
  );
}
