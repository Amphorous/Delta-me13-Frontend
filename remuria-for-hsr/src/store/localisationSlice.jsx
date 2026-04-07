import { createSlice } from "@reduxjs/toolkit";

const localisationSlice = createSlice({
    name: "localisation",
    initialState: {
        loc: "en"
    },
    reducers: {
        setLoc: (state, action) => {
            state.loc = action.payload;
        }
    }
});

export const selectLoc = (state) => state.localisation.loc;
export const { setLoc } = localisationSlice.actions;
export default localisationSlice.reducer;