import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Param } from '@/shared/types/request';

export interface RequestParamsState {
	params: Param[];
}

const initialState: RequestParamsState = {
	params: [{ key: '', value: '', checked: false }],
};

const requestParamsSlice = createSlice({
	name: 'requestParams',
	initialState,
	reducers: {
		setParams: (state, action: PayloadAction<Param[]>) => {
			state.params = action.payload;
		},
	},
});

export const { setParams } = requestParamsSlice.actions;
export default requestParamsSlice.reducer;
