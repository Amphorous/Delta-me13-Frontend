import { configureStore } from '@reduxjs/toolkit';
import localUsersReducer from './localUsersSlice';
import focusedUserReducer from './userCardSlice';
import authReducer from './authSlice';
import loadedJSONReducer from './loadedJSONSlice';

const store = configureStore({
  reducer: {
    localUsers: localUsersReducer,
    focusedUser: focusedUserReducer,
    auth: authReducer,
    loadedJSON: loadedJSONReducer
  }
});

export default store;
