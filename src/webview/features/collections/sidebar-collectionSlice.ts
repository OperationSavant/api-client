import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Collection } from '@/shared/types/collection';

export interface CollectionsState {
	collections: Collection[];
}

const initialState: CollectionsState = {
	collections: [],
};

const collectionsSlice = createSlice({
	name: 'sidebarCollections',
	initialState,
	reducers: {
		setCollections: (state, action: PayloadAction<Collection[]>) => {
			state.collections = action.payload;
		},
		addCollection: (state, action: PayloadAction<Collection>) => {
			state.collections.push(action.payload);
		},
		setCollectionState: (state, action: PayloadAction<CollectionsState>) => {
			return action.payload;
		},
	},
});

export const { setCollections, addCollection, setCollectionState } = collectionsSlice.actions;
export default collectionsSlice.reducer;
