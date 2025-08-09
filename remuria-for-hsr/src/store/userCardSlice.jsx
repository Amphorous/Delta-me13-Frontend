import { createSlice } from "@reduxjs/toolkit";

const userInFocusSlice = createSlice({
    name: 'focusedUser',
    initialState: "",
    reducers: {
        setFocus: (state, action) => {
            return action.payload;
        },
        
        removeFocus: () =>{
            return "";
        }
    }
});

export const { setFocus, removeFocus } = userInFocusSlice.actions;
export default userInFocusSlice.reducer;