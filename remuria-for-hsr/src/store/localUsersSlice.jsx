import { createSlice } from '@reduxjs/toolkit';

const LOCAL_STORAGE_KEY = "localUsers:RE:MURIA:HSR:";
const LOCAL_STORE_USER_COUNT = 15

function loadFromLocalStorage(){
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function saveToLocalStorage(users){
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
};

const localUsersSlice = createSlice({
  name: 'localUsers',
  initialState: loadFromLocalStorage(),
  reducers: {
    setUsers: (state, action) => {
      saveToLocalStorage(action.payload);
      return action.payload;
    },

    addOrReplaceUser: (state, action) => {
      const user = action.payload;
      const filtered = state.filter(u => u.uid !== user.uid);
      const updated = [...filtered, user].slice(-1 * LOCAL_STORE_USER_COUNT);
      saveToLocalStorage(updated);
      return updated;
    },

    clearUsers: () => {
      saveToLocalStorage([]);
      return [];
    },

    removeUser: (state, action) => {
      const uid = action.payload;
      const filtered = state.filter(u => u.uid !== uid);
      const updated = [...filtered].slice(-1 * LOCAL_STORE_USER_COUNT); 
      saveToLocalStorage(updated);
      return updated;
    }
  }
});

export const { setUsers, addOrReplaceUser, clearUsers, removeUser } = localUsersSlice.actions;
export default localUsersSlice.reducer;
