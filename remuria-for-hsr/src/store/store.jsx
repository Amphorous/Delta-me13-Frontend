import { configureStore } from '@reduxjs/toolkit';
import localUsersReducer from './localUsersSlice';
import focusedUserReducer from './userCardSlice'

const store = configureStore({
  reducer: {
    localUsers: localUsersReducer,
    focusedUser: focusedUserReducer
  }
});

export default store;
