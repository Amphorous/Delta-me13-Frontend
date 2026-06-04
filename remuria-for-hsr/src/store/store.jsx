import { configureStore } from '@reduxjs/toolkit';
import localUsersReducer from './localUsersSlice';
import focusedUserReducer from './userCardSlice';
import authReducer from './authSlice';
import localisationReducer from './localisationSlice';
import settingsReducer from './settingsSlice';

const SETTINGS_STORAGE_KEY = 're:muria:settings';

const store = configureStore({
  reducer: {
    localUsers: localUsersReducer,
    focusedUser: focusedUserReducer,
    auth: authReducer,
    localisation: localisationReducer,
    settings: settingsReducer,
  }
});

store.subscribe(() => {
  const { settings } = store.getState();
  if (settings.persistSettings) {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } else {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  }
});

export default store;
