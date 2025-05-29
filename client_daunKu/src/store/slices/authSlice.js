import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from "../../services/authService";

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem("access_token", response.data.access_token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (googleData, { rejectWithValue }) => {
    try {
      const response = await authService.googleLogin(googleData);
      localStorage.setItem("access_token", response.data.access_token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Tambahkan async thunk untuk validate token
export const validateToken = createAsyncThunk(
  "auth/validateToken",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token found");
      
      const response = await authService.validateToken(token);
      return response.data;
    } catch (error) {
      localStorage.removeItem("access_token");
      return rejectWithValue("Invalid token");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("access_token"),
    isLoading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem("access_token"),
  },
  reducers: {
    restoreAuth: (state) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
      }
    },
    logout: (state) => {
      localStorage.removeItem("access_token");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Di bagian extraReducers, perbaiki loginUser.fulfilled:
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token; // ✅ Ubah dari access_token ke token
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Google Login - PERBAIKI INI
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token; // ✅ Ubah dari state.access_token
        state.isAuthenticated = true;
      });
  },
});

// Di bagian export, tambahkan restoreAuth:
export const { logout, clearError, restoreAuth } = authSlice.actions;
export default authSlice.reducer;
