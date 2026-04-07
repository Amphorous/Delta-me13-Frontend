import { configureStore } from '@reduxjs/toolkit';
import localUsersReducer from './localUsersSlice';
import focusedUserReducer from './userCardSlice';
import authReducer from './authSlice';
import localisationReducer from './localisationSlice';

const store = configureStore({
  reducer: {
    localUsers: localUsersReducer,
    focusedUser: focusedUserReducer,
    auth: authReducer,
    localisation: localisationReducer
  }
});

export default store;
