import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = 'http://localhost:8000/api';

export const submitInteractionForm = createAsyncThunk(
  'interaction/submit',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/interactions/`, formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Error submitting interaction');
    }
  }
);

export const fetchInteractions = createAsyncThunk(
  'interaction/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/interactions/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const updateInteraction = createAsyncThunk(
  'interaction/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${API}/interactions/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

const initialForm = {
  hcp_name: '',
  interaction_type: 'Meeting',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  attendees: '',
  topics_discussed: '',
  materials_shared: [],
  samples_distributed: [],
  sentiment: 'Neutral',
  outcomes: '',
  follow_up_actions: '',
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState: {
    form: initialForm,
    interactions: [],
    loading: false,
    success: false,
    error: null,
    aiSuggestions: [],
    activeTab: 'form', // 'form' | 'chat'
  },
  reducers: {
    updateForm: (state, action) => {
      state.form = { ...state.form, ...action.payload };
    },
    resetForm: (state) => {
      state.form = initialForm;
      state.success = false;
      state.error = null;
    },
    setAiSuggestions: (state, action) => {
      state.aiSuggestions = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitInteractionForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitInteractionForm.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.interactions.unshift(action.payload);
      })
      .addCase(submitInteractionForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.interactions = action.payload;
      });
  },
});

export const { updateForm, resetForm, setAiSuggestions, setActiveTab } = interactionSlice.actions;
export default interactionSlice.reducer;
