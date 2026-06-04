import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchBindings = createAsyncThunk('bindings/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_AUTH_API_URL}/api/binding-code/get-bindings`,
      { withCredentials: true }
    );
    return res.data;
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

const bindingsSlice = createSlice({
  name: 'bindings',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchBindings.fulfilled, (state, action) => {
      return action.payload;
    });
  },
});

export default bindingsSlice.reducer;
