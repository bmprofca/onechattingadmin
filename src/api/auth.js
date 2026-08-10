import axios from 'axios';
import { Encrypt } from '../pages/encryption/payload-encryption';
import { API_BASE_URL } from '../config/api';

const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem('userData');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Admin login — returns API response (`token`, `username`, `profile`, …). */
export const loginUser = async ({ email, password }) => {
  const { data, key } = Encrypt({ email, password });

  const response = await axios.post(
    `${API_BASE_URL}/admin/login`,
    JSON.stringify({ data, key }),
    {
      headers: { 'Content-Type': 'application/json' },
      maxBodyLength: Infinity
    }
  );

  return response.data;
};

/** Load current account profile (used by header). */
export const fetchUserProfile = async () => {
  const auth = getStoredAuth();

  const response = await axios.post(
    `${API_BASE_URL}/account/profile`,
    null,
    {
      headers: {
        token: auth?.token,
        username: auth?.username,
        'Content-Type': 'application/json'
      },
      maxBodyLength: Infinity
    }
  );

  return response.data;
};
