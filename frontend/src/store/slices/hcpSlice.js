import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = 'http://localhost:8000/api';

export const fetchHCPs = createAsyncThunk('hcp/fetchAll', async () => {
  const res = await axios.get(`${API}/hcp/`);
  return res.data;
});

const hcpSlice = createSlice({
  name: 'hcp',
  initialState: {
    hcps: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHCPs.pending, (state) => { state.loading = true; })
      .addCase(fetchHCPs.fulfilled, (state, action) => {
        state.loading = false;
        state.hcps = action.payload;
      });
  },
});

export default hcpSlice.reducer;
