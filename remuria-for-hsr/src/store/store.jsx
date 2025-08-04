import { configureStore } from '@reduxjs/toolkit';
import localUsersReducer from './localUsersSlice';

const store = configureStore({
  reducer: {
    localUsers: localUsersReducer
  }
});

export default store;
