import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import plantService from "../../services/plantService";

// Async thunks
export const fetchPlants = createAsyncThunk(
  "plants/fetchPlants",
  async (_, { rejectWithValue }) => {
    try {
      const response = await plantService.getPlants();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchPlantById = createAsyncThunk(
  "plants/fetchPlantById",
  async (plantId, { rejectWithValue }) => {
    try {
      const response = await plantService.getPlantById(plantId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const addPlant = createAsyncThunk(
  "plants/addPlant",
  async (plantData, { rejectWithValue }) => {
    try {
      const response = await plantService.addPlant(plantData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const deletePlant = createAsyncThunk(
  "plants/deletePlant",
  async (plantId, { rejectWithValue }) => {
    try {
      await plantService.deletePlant(plantId);
      return plantId;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const identifyPlant = createAsyncThunk(
  "plants/identifyPlant",
  async (imageFile, { rejectWithValue }) => {
    try {
      const response = await plantService.identifyPlant(imageFile);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const plantSlice = createSlice({
  name: "plants",
  initialState: {
    plants: [],
    selectedPlant: null,
    isLoading: false,
    error: null,
    identificationResult: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearIdentificationResult: (state) => {
      state.identificationResult = null;
    },
    clearSelectedPlant: (state) => {
      state.selectedPlant = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Plants
      .addCase(fetchPlants.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPlants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plants = action.payload;
      })
      .addCase(fetchPlants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Plant By ID
      .addCase(fetchPlantById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlantById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedPlant = action.payload;
        state.error = null;
      })
      .addCase(fetchPlantById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add Plant
      .addCase(addPlant.fulfilled, (state, action) => {
        state.plants.push(action.payload);
      })
      // Delete Plant
      .addCase(deletePlant.fulfilled, (state, action) => {
        state.plants = state.plants.filter(
          (plant) => plant.id !== action.payload
        );
      })
      // Identify Plant
      .addCase(identifyPlant.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(identifyPlant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.identificationResult = action.payload;
      })
      .addCase(identifyPlant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearIdentificationResult, clearSelectedPlant } =
  plantSlice.actions;
export default plantSlice.reducer;
