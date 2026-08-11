import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiCall } from '../utils/apiCall';
import { Encrypt } from '../pages/encryption/payload-encryption';

// Fetch project info (wallet balance and other info) by project id
export const fetchProjectInfo = createAsyncThunk(
  'project/fetchProjectInfo',
  async (maybeProjectId, { rejectWithValue }) => {
    try {
      // Load tokens and project id from storage
      const stored = (typeof window !== 'undefined')
        ? localStorage.getItem('user_data') || localStorage.getItem('userData') || sessionStorage.getItem('userData')
        : null;
      const parsed = stored ? JSON.parse(stored) : null;

      const token = parsed?.token;
      const username = parsed?.username;
      const selectedProjectId = parsed?.selected_project_id;
      const projectId =
        maybeProjectId ||
        selectedProjectId ||
        parsed?.projects?.[0]?.project_id ||
        '';

      if (!token || !username) {
        return rejectWithValue('Missing auth tokens');
      }
      if (!projectId) {
        return rejectWithValue('Missing project id');
      }

      // Only pass project_id in payload (as requested)
      const payload = { project_id: projectId };
      const { data, key } = Encrypt(payload);
      const data_pass = JSON.stringify({ data, key });

      const response = await apiCall('/project/info', 'POST', data_pass, {
        token,
        username,
      });
      const responseData = await response.json();

      if (!response.ok || responseData?.error) {
        return rejectWithValue(responseData?.message || responseData?.error || 'Failed to fetch project info');
      }

      // Normalize wallet balance and permissions based on actual API shape
      // Expected shape:
      // {
      //   error: false,
      //   project: { balance: number, ... },
      //   permissions: { ... }
      // }
      const root = responseData ?? {};
      const walletBalance = Number(
        (root.project && root.project.balance != null ? root.project.balance : null) ??
        (root.balance != null ? root.balance : null) ??
        (root.data && root.data.wallet_balance != null ? root.data.wallet_balance : null) ??
        0
      );
      const permissions = root.permissions ?? null;

      return {
        raw: responseData,
        walletBalance,
        permissions
      };
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  }
);

const initialState = {
  walletBalance: 0,
  status: 'idle',
  error: null,
  info: null,
  permissions: null
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    resetProjectState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectInfo.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProjectInfo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.walletBalance = action.payload.walletBalance;
        state.info = action.payload.raw;
        state.permissions = action.payload.permissions;
      })
      .addCase(fetchProjectInfo.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch project info';
      });
  }
});

export const { resetProjectState } = projectSlice.actions;
export default projectSlice.reducer;


