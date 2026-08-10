import axios from 'axios';
import { Encrypt } from '../pages/encryption/payload-encryption';
import { API_BASE_URL } from '../config/api';

// Helper to get auth token
const getAuthToken = () => {
  const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  if (userData) {
    const parsed = JSON.parse(userData);
    return parsed.token;
  }
  return null;
};

// ==========================================
// SUBSCRIPTION PACKS MANAGEMENT
// ==========================================

/**
 * Get all subscription packs
 * @param {boolean} includeDeleted - Include deleted packs
 * @param {boolean} activeOnly - Only active packs
 */
export const getAllPacks = async (includeDeleted = false, activeOnly = false) => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  if (includeDeleted) params.append('include_deleted', 'true');
  if (activeOnly) params.append('active_only', 'true');

  const response = await axios.get(
    `${API_BASE_URL}/admin/subscription/all-packs?${params.toString()}`,
    {
      headers: { 'x-token': token }
    }
  );
  return response.data;
};

/**
 * Get pack by ID
 * @param {string} packId - Pack ID
 */
export const getPackById = async (packId) => {
  const token = getAuthToken();
  const response = await axios.get(
    `${API_BASE_URL}/admin/subscription/packs/${packId}`,
    {
      headers: { 'x-token': token }
    }
  );
  return response.data;
};

/**
 * Create new subscription pack
 * @param {object} packData - Pack data
 */
export const createPack = async (packData) => {
  const token = getAuthToken();
  const { data, key } = Encrypt(packData);
  
  const response = await axios.post(
    `${API_BASE_URL}/admin/subscription/create-pack`,
    { data, key },
    {
      headers: {
        'x-token': token,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

/**
 * Update subscription pack
 * @param {string} packId - Pack ID
 * @param {object} updateData - Update data
 */
export const updatePack = async (packId, updateData) => {
  const token = getAuthToken();
  const payload = { ...updateData, pack_id: packId };
  const { data, key } = Encrypt(payload);
  
  const response = await axios.post(
    `${API_BASE_URL}/admin/subscription/update-pack`,
    { data, key },
    {
      headers: {
        'x-token': token,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

/**
 * Delete subscription pack
 * @param {string} packId - Pack ID
 */
export const deletePack = async (packId) => {
  const token = getAuthToken();
  const payload = { pack_id: packId };
  const { data, key } = Encrypt(payload);
  
  const response = await axios.post(
    `${API_BASE_URL}/admin/subscription/delete-pack`,
    { data, key },
    {
      headers: {
        'x-token': token,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

// ==========================================
// CUSTOM PRICING MANAGEMENT
// ==========================================

/**
 * Set custom pricing for user
 * @param {string} username - Username
 * @param {string} packId - Pack ID
 * @param {number} customAmount - Custom amount
 * @param {string} isActive - "1" or "0"
 */
export const setUserPricing = async (username, packId, customAmount, isActive = '1') => {
  const token = getAuthToken();
  const payload = {
    username,
    pack_id: packId,
    custom_amount: customAmount,
    is_active: isActive
  };

  const { data, key } = Encrypt(payload);

  const response = await axios.post(
    `${API_BASE_URL}/admin/subscription/set-user-pricing`,
    { data, key },
    {
      headers: {
        'x-token': token,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

/**
 * Remove custom pricing for user
 * @param {string} username - Username
 * @param {string} packId - Pack ID
 */
export const removeUserPricing = async (username, packId) => {
  const token = getAuthToken();
  const payload = {
    username,
    pack_id: packId
  };

  const { data, key } = Encrypt(payload);

  const response = await axios.post(
    `${API_BASE_URL}/admin/subscription/remove-user-pricing`,
    { data, key },
    {
      headers: {
        'x-token': token,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

/**
 * Get user's custom pricing
 * @param {string} username - Username
 */
export const getUserPricing = async (username) => {
  const token = getAuthToken();
  const response = await axios.get(
    `${API_BASE_URL}/admin/subscription/user-pricing/${username}`,
    {
      headers: { 'x-token': token }
    }
  );
  return response.data;
};

/**
 * Get all custom pricing
 * @param {object} filters - Optional filters { username, pack_id }
 */
export const getAllCustomPricing = async (filters = {}) => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  if (filters.username) params.append('username', filters.username);
  if (filters.pack_id) params.append('pack_id', filters.pack_id);

  const response = await axios.get(
    `${API_BASE_URL}/admin/subscription/all-custom-pricing?${params.toString()}`,
    {
      headers: { 'x-token': token }
    }
  );
  return response.data;
};

// ==========================================
// USER SUBSCRIPTION MANAGEMENT
// ==========================================

/**
 * Get user's subscription packs with pricing (by username)
 * @param {string} username - Username
 * @param {boolean} includeExpired - Include expired subscriptions
 */
export const getUserPlans = async (username, includeExpired = false) => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  if (includeExpired) params.append('include_expired', 'true');

  const response = await axios.get(
    `${API_BASE_URL}/admin/subscription/user-plans/${username}?${params.toString()}`,
    {
      headers: { 'x-token': token }
    }
  );
  return response.data;
};

/**
 * Get user's subscription packs with pricing (by user ID)
 * @param {number} userId - User ID
 * @param {boolean} includeExpired - Include expired subscriptions
 */
export const getUserPlansById = async (userId, includeExpired = false) => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  if (includeExpired) params.append('include_expired', 'true');

  const response = await axios.get(
    `${API_BASE_URL}/admin/subscription/user-plans-by-id/${userId}?${params.toString()}`,
    {
      headers: { 'x-token': token }
    }
  );
  return response.data;
};

/**
 * Get all subscriptions (admin view)
 * @param {object} filters - Optional filters { status, pack_type, username }
 */
export const getAllSubscriptions = async (filters = {}) => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.pack_type) params.append('pack_type', filters.pack_type);
  if (filters.username) params.append('username', filters.username);

  const response = await axios.get(
    `${API_BASE_URL}/admin/subscription/all-subscriptions?${params.toString()}`,
    {
      headers: { 'x-token': token }
    }
  );
  return response.data;
};

/**
 * Cancel subscription
 * @param {string} subscriptionId - Subscription ID
 */
export const cancelSubscription = async (subscriptionId) => {
  const token = getAuthToken();
  const response = await axios.post(
    `${API_BASE_URL}/admin/subscription/cancel`,
    { subscription_id: subscriptionId },
    {
      headers: {
        'x-token': token,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

// ==========================================
// CLIENT SUBSCRIPTION OPERATIONS
// ==========================================

/**
 * Subscribe to a pack (client)
 * @param {string} packId - Pack ID
 * @param {boolean} useWallet - Use wallet balance
 * @param {string} billingCycle - Billing cycle
 * @param {string} autoRenew - "1" or "0"
 */
export const subscribeToPackClient = async (packId, useWallet = true, billingCycle = 'monthly', autoRenew = '1') => {
  const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  const parsed = userData ? JSON.parse(userData) : null;
  const token = parsed?.token;
  const username = parsed?.username;

  const payload = {
    pack_id: packId,
    use_wallet: useWallet,
    billing_cycle: billingCycle,
    auto_renew: autoRenew
  };

  const { data, key } = Encrypt(payload);

  const response = await axios.post(
    `${API_BASE_URL}/payment/subscription-payment`,
    { data, key },
    {
      headers: {
        'token': token,
        'username': username,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

/**
 * Check subscription payment status (client)
 * @param {string} orderId - Order ID
 */
export const checkSubscriptionPaymentStatus = async (orderId) => {
  const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  const parsed = userData ? JSON.parse(userData) : null;
  const token = parsed?.token;
  const username = parsed?.username;

  const payload = {
    order_id: orderId
  };

  const { data, key } = Encrypt(payload);

  const response = await axios.post(
    `${API_BASE_URL}/payment/subscription-payment-status`,
    { data, key },
    {
      headers: {
        'token': token,
        'username': username,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

/**
 * Get my subscriptions (client)
 * @param {boolean} includeExpired - Include expired subscriptions
 */
export const getMySubscriptions = async (includeExpired = false) => {
  const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  const parsed = userData ? JSON.parse(userData) : null;
  const token = parsed?.token;
  const username = parsed?.username;

  const payload = {
    include_expired: includeExpired
  };

  // Optional encryption for this endpoint
  const { data, key } = Encrypt(payload);

  const response = await axios.post(
    `${API_BASE_URL}/payment/my-subscriptions`,
    { data, key },
    {
      headers: {
        'token': token,
        'username': username,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export default {
  // Packs
  getAllPacks,
  getPackById,
  createPack,
  updatePack,
  deletePack,
  
  // Custom Pricing
  setUserPricing,
  removeUserPricing,
  getUserPricing,
  getAllCustomPricing,
  
  // User Subscriptions
  getUserPlans,
  getUserPlansById,
  getAllSubscriptions,
  cancelSubscription,
  
  // Client Operations
  subscribeToPackClient,
  checkSubscriptionPaymentStatus,
  getMySubscriptions
};
