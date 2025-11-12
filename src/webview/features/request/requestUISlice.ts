import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RequestState {
	currentTab: string;
}

const initialState: RequestState = {
	currentTab: 'params',
};

const requestUISlice = createSlice({
	name: 'requestUI',
	initialState,
	reducers: {
		setCurrentTab(state, action: PayloadAction<string>) {
			state.currentTab = action.payload;
		},
	},
});

export const { setCurrentTab } = requestUISlice.actions;

export default requestUISlice.reducer;
