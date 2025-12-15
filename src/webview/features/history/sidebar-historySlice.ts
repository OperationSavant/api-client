import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HistoryItem } from '@/shared/types/history';

export interface HistoryState {
	history: HistoryItem[];
}

const initialState: HistoryState = {
	history: [],
};

const historySlice = createSlice({
	name: 'sidebarHistory',
	initialState,
	reducers: {
		setHistory: (state, action: PayloadAction<HistoryItem[]>) => {
			state.history = action.payload;
		},
		addHistoryItem: (state, action: PayloadAction<HistoryItem>) => {
			state.history.unshift(action.payload);
		},
		removeHistoryItem: (state, action: PayloadAction<string>) => {
			state.history = state.history.filter(item => item.historyId !== action.payload);
		},
		clearHistory: state => {
			state.history = [];
		},
		setHistoryState: (state, action: PayloadAction<HistoryState>) => {
			return action.payload;
		},
	},
});

export const { setHistory, addHistoryItem, removeHistoryItem, clearHistory, setHistoryState } = historySlice.actions;
export default historySlice.reducer;
