import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Collection } from '@/shared/types/collection';

export interface CollectionsState {
	collections: Collection[];
}

const initialState: CollectionsState = {
	collections: [],
};

const collectionsSlice = createSlice({
	name: 'collections',
	initialState,
	reducers: {
		setCollections: (state, action: PayloadAction<Collection[]>) => {
			state.collections = action.payload;
		},
		addCollection: (state, action: PayloadAction<Collection>) => {
			state.collections.push(action.payload);
		},
	},
});

export const { setCollections, addCollection } = collectionsSlice.actions;
export default collectionsSlice.reducer;
