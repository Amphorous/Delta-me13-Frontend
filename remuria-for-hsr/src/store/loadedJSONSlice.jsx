import { createSlice } from "@reduxjs/toolkit";
import relicsData from '../assets/relics.json';
import locData from '../assets/hsr.json';
import textMap from '../assets/textMap/TextMapEN.json';
import itemConfigRelic from '../assets/textMap/itemConfigRelic.json';

const loadedJSONSlice = createSlice({
    name: "loadedJSON",
    initialState: { 
        loc: locData,
        textMap: textMap,
        relics: relicsData,
        itemConfigRelic: itemConfigRelic
    },
    reducers: {}
});

export const selectLocalization = (state) => state.loadedJSON.loc;
export const selectRelicsInfo = (state) => state.loadedJSON.relics;
export const selectTextMap = (state) => state.loadedJSON.textMap;
export const selectItemConfigRelic = (state) => state.loadedJSON.itemConfigRelic;
export default loadedJSONSlice.reducer;