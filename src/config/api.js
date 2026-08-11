const rawBaseUrl =
  process.env.REACT_APP_API_BASE_URL || 'https://server.onechatting.com';

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

/** Customer portal (Client app) — used for “login as user”. */
export const PORTAL_URL = (
  process.env.REACT_APP_PORTAL_URL || 'https://app.onechatting.com'
).replace(/\/$/, '');

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
