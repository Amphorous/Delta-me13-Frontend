import { createSlice } from "@reduxjs/toolkit";

const userInFocusSlice = createSlice({
    name: 'focusedUser',
    initialState: {
        uid: "000000000",
        nickname: "Mihoyo Employee",
        signature: "Busy making Xiao supports",
        region: "MHY",
        headIcon: 0,
        level: 80,
        achievementCount: 999,
        buildsPublic: false
    },
    reducers: {
        setFocus: (state, action) => {
            return action.payload;
        },
        
        removeFocus: () =>{
            return {
                uid: "000000000",
                nickname: "Mihoyo Employee",
                signature: "Busy making Xiao supports",
                region: "MHY",
                headIcon: 0,
                level: 80,
                achievementCount: 999,
                buildsPublic: false
            };
        }
    }
});

export const { setFocus, removeFocus } = userInFocusSlice.actions;
export default userInFocusSlice.reducer;