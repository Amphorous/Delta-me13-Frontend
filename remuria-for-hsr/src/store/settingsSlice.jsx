import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 're:muria:settings';

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.persistSettings) return null;
        return parsed;
    } catch {
        return null;
    }
}

const defaults = {
    relicAnimations: false,
    backgroundImageKey: 'backgrounds/tes',
    cardBackgroundImageKey: 'card_backgrounds/albedo',
    persistSettings: false,
    themeKey: 'purple',
};

const saved = loadFromStorage();
const initialState = saved ? { ...defaults, ...saved } : { ...defaults };

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        toggleSetting: (state, action) => {
            const key = action.payload;
            state[key] = !state[key];
        },
        setBackgroundImage: (state, action) => {
            state.backgroundImageKey = action.payload;
        },
        setCardBackgroundImage: (state, action) => {
            state.cardBackgroundImageKey = action.payload;
        },
        setTheme: (state, action) => {
            state.themeKey = action.payload;
        },
    },
});

export const { toggleSetting, setBackgroundImage, setCardBackgroundImage, setTheme } = settingsSlice.actions;
export const selectSettings = (state) => state.settings;
export const selectRelicAnimations = (state) => state.settings.relicAnimations;
export const selectBackgroundImageKey = (state) => state.settings.backgroundImageKey;
export const selectCardBackgroundImageKey = (state) => state.settings.cardBackgroundImageKey;
export const selectThemeKey = (state) => state.settings.themeKey;
export default settingsSlice.reducer;
