import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import careLogService from "../../services/careLogService";

export const fetchCareLogs = createAsyncThunk(
  "careLogs/fetchCareLogs",
  async (plantId = null, { rejectWithValue }) => {
    try {
      const response = await careLogService.getCareLogs(plantId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const addCareLog = createAsyncThunk(
  "careLogs/addCareLog",
  async (careLogData, { rejectWithValue }) => {
    try {
      const response = await careLogService.addCareLog(careLogData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const generateCareSchedule = createAsyncThunk(
  "careLogs/generateCareSchedule",
  async (plantIds, { rejectWithValue }) => {
    try {
      const response = await careLogService.generateCareSchedule(plantIds);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const careLogSlice = createSlice({
  name: "careLogs",
  initialState: {
    careLogs: [],
    careSchedule: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCareSchedule: (state) => {
      state.careSchedule = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Care Logs
      .addCase(fetchCareLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCareLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        // Jika payload adalah { careLogs: [...] }
        state.careLogs = action.payload.careLogs || [];
      })
      .addCase(fetchCareLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.careLogs = []; // Reset ke array kosong saat error
      })
      // Add Care Log
      .addCase(addCareLog.fulfilled, (state, action) => {
        state.careLogs.push(action.payload);
      })
      // Generate Care Schedule
      .addCase(generateCareSchedule.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(generateCareSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.careSchedule = action.payload;
      })
      .addCase(generateCareSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCareSchedule } = careLogSlice.actions;
export default careLogSlice.reducer;
