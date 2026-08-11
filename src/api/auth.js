import { apiCall } from '../utils/apiCall';

export const sendOtp = async (mobile) => {
  const response = await apiCall('/admin/send-otp', 'POST', { mobile });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }
  return data;
};

export const verifyOtp = async (mobile, otp) => {
  const response = await apiCall('/admin/verify-otp', 'POST', { mobile, otp });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify OTP');
  }
  return data;
};
