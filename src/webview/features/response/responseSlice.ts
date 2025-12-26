import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface ResponseState {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string | null;
	isLargeBody?: boolean;
	bodyFilePath?: string;
	contentType: string;
	size: number;
	duration: number;
	isError: boolean;
	error?: string;
}

const initialState: ResponseState | null = null;

export const responseSlice = createSlice({
	name: 'response',
	initialState: initialState as ResponseState | null,
	reducers: {
		setResponse: (_state, action: PayloadAction<ResponseState | null>) => {
			return action.payload;
		},
		clearResponse: () => {
			return null;
		},
	},
});
export const { setResponse, clearResponse } = responseSlice.actions;
export default responseSlice.reducer;
