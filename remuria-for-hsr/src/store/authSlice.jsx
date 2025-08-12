import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunk to check auth status
export const checkAuth = createAsyncThunk("auth/checkAuth", async () => {
  try {
    const response = await fetch('http://localhost:8080/api/auth/status', {
      credentials: 'include',
    });
    const data = await response.json();
    console.log('Full Discord user object:', data);

    if (data.authenticated) {
      return data;
    } else {
      return { authenticated: false };
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    return { authenticated: false };
  }
});

// Thunk to logout
export const logout = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
    try {
      const csrfRes = await axios.get("http://localhost:8080/csrf-token", {
        withCredentials: true,
      });
      const csrfToken = csrfRes.data.token;

      await axios.post(
        "http://localhost:8080/logout",
        {}, 
        {
          withCredentials: true,
          headers: {
            "X-XSRF-TOKEN": csrfToken,
          },
        }
      );

      window.location.href = "http://localhost:5173/home";

      return { authenticated: false };
    } catch (error) {
      console.error("Logout failed:", error);
      return rejectWithValue(error.message);
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState: { authenticated: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(logout.fulfilled, (state, action) => {
        return action.payload;
      });
  },
});

export default authSlice.reducer;
