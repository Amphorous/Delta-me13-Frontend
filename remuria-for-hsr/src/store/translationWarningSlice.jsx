import { createSlice } from '@reduxjs/toolkit';

// Surfaces the Translator service's "_warning" field (present on translate
// responses while its Redis is still loading/warming up — see hashTranslation.js)
// as global app state, so a banner can show it regardless of which component
// happened to trigger the translate request that carried it.
const translationWarningSlice = createSlice({
  name: 'translationWarning',
  initialState: { text: null },
  reducers: {
    setTranslationWarning(state, action) {
      state.text = action.payload;
    },
  },
});

export const { setTranslationWarning } = translationWarningSlice.actions;
export const selectTranslationWarning = (state) => state.translationWarning.text;
export default translationWarningSlice.reducer;
