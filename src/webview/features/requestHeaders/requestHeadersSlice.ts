import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Param } from '@/shared/types/request'; // Assuming Headers use the same Param type

export interface RequestHeadersState {
	headers: Param[];
}

const initialState: RequestHeadersState = {
	headers: [{ key: '', value: '', checked: false }],
};

const requestHeadersSlice = createSlice({
	name: 'requestHeaders',
	initialState,
	reducers: {
		setHeaders: (state, action: PayloadAction<Param[]>) => {
			state.headers = action.payload;
		},
	},
});

export const { setHeaders } = requestHeadersSlice.actions;
export default requestHeadersSlice.reducer;
