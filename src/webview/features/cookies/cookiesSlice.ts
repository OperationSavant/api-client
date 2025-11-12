import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Cookie } from '@/shared/types/cookie';

export interface CookiesState {
	items: Cookie[];
}

const initialState: CookiesState = {
	items: [],
};

const cookiesSlice = createSlice({
	name: 'cookies',
	initialState,
	reducers: {
		setCookies: (state, action: PayloadAction<Cookie[]>) => {
			state.items = action.payload;
		},
		addCookie: (state, action: PayloadAction<Cookie>) => {
			// Check if cookie already exists (by composite key)
			const existingIndex = state.items.findIndex(c => c.name === action.payload.name && c.domain === action.payload.domain && c.path === action.payload.path);

			if (existingIndex !== -1) {
				// Update existing cookie
				state.items[existingIndex] = action.payload;
			} else {
				// Add new cookie
				state.items.push(action.payload);
			}
		},
		updateCookie: (
			state,
			action: PayloadAction<{
				name: string;
				domain: string;
				path: string;
				updates: Partial<Cookie>;
			}>
		) => {
			const { name, domain, path, updates } = action.payload;
			const index = state.items.findIndex(c => c.name === name && c.domain === domain && c.path === path);

			if (index !== -1) {
				state.items[index] = { ...state.items[index], ...updates };
			}
		},
		deleteCookie: (
			state,
			action: PayloadAction<{
				name: string;
				domain: string;
				path: string;
			}>
		) => {
			const { name, domain, path } = action.payload;
			state.items = state.items.filter(c => !(c.name === name && c.domain === domain && c.path === path));
		},
		clearAllCookies: state => {
			state.items = [];
		},
	},
});

export const { setCookies, addCookie, updateCookie, deleteCookie, clearAllCookies } = cookiesSlice.actions;

export default cookiesSlice.reducer;
