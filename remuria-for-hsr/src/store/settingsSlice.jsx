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
    backgroundImageKey: 'backgrounds/unknowable_herta',
    cardBackgroundImageKey: 'card_backgrounds/albedo',
    persistSettings: false,
    themeKey: 'purple',
    pillColorMode: 'card',
    settingsWidth: 'md',
    relicTwoColumn: false,
    relicShowCV: false,
    relicCVShimmer: true,
    bgBlur: 'medium',
    rankIconShimmer: false,
    jpKanjiMode: true,
    hideBuildIdentity: false,
    buildCardStarfield: false,
    nameOverflowScrollMode: false,
    // null = no manual choice yet; BuildDetailCard falls back to the active
    // locale's own default font (see weaponNameFontOptionsForLocale in
    // buildConstants.js) whenever this is null OR not a valid option for the
    // current locale — so switching languages never leaves this pointed at a
    // font that's not even offered for that language anymore.
    weaponNameFontClass: null,
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
        setPillColorMode: (state, action) => {
            state.pillColorMode = action.payload;
        },
        setSettingsWidth: (state, action) => {
            state.settingsWidth = action.payload;
        },
        setBgBlur: (state, action) => {
            state.bgBlur = action.payload;
        },
        setWeaponNameFontClass: (state, action) => {
            state.weaponNameFontClass = action.payload;
        },
    },
});

export const { toggleSetting, setBackgroundImage, setCardBackgroundImage, setTheme, setPillColorMode, setSettingsWidth, setBgBlur, setWeaponNameFontClass } = settingsSlice.actions;
export const selectSettings = (state) => state.settings;
export const selectRelicAnimations = (state) => state.settings.relicAnimations;
export const selectBackgroundImageKey = (state) => state.settings.backgroundImageKey;
export const selectCardBackgroundImageKey = (state) => state.settings.cardBackgroundImageKey;
export const selectThemeKey = (state) => state.settings.themeKey;
export const selectPillColorMode = (state) => state.settings.pillColorMode;
export const selectSettingsWidth = (state) => state.settings.settingsWidth;
export const selectRelicTwoColumn = (state) => state.settings.relicTwoColumn;
export const selectRelicShowCV = (state) => state.settings.relicShowCV;
export const selectRelicCVShimmer = (state) => state.settings.relicCVShimmer;
export const selectBgBlur = (state) => state.settings.bgBlur;
export const selectRankIconShimmer = (state) => state.settings.rankIconShimmer;
export const selectJpKanjiMode = (state) => state.settings.jpKanjiMode;
export const selectHideBuildIdentity = (state) => state.settings.hideBuildIdentity;
export const selectBuildCardStarfield = (state) => state.settings.buildCardStarfield;
// false (default) = shrink the build-card name to fit (wrapping to a second
// vertical column if shrinking alone isn't enough); true = keep it at full
// size and let the name row scroll instead.
export const selectNameOverflowScrollMode = (state) => state.settings.nameOverflowScrollMode;
export const selectWeaponNameFontClass = (state) => state.settings.weaponNameFontClass;
export default settingsSlice.reducer;
