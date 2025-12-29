import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Response } from '@/shared/types/response';

const initialState: Response | null = null;

export const responseSlice = createSlice({
	name: 'response',
	initialState: initialState as Response | null,
	reducers: {
		setResponse: (_state, action: PayloadAction<Response | null>) => {
			return action.payload;
		},
		clearResponse: () => {
			return null;
		},
	},
});
export const { setResponse, clearResponse } = responseSlice.actions;
export default responseSlice.reducer;
