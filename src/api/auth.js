import { apiRequest } from '../utils/apiCall';

/** Send a login OTP to an admin mobile number. Throws ApiError on failure. */
export const sendOtp = async (mobile) => {
  const { message } = await apiRequest('/admin/send-otp', 'POST', { mobile });
  return { message };
};

/** Verify the OTP. Resolves with { token, username, profile }. Throws ApiError on failure. */
export const verifyOtp = async (mobile, otp) => {
  const { data } = await apiRequest('/admin/verify-otp', 'POST', { mobile, otp });
  return data;
};
