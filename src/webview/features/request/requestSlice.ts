import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthConfig } from '@/shared/types/auth';
import { CollectionRequest } from '@/shared/types/collection';

export interface RequestState {
	id?: string; // The ID of the request if it's from a collection
	name: string;
	description?: string;
	collectionId?: string;
	url: string;
	method: string;
	protocol: string;
	auth: AuthConfig;
}

const initialState: RequestState = {
	id: undefined,
	name: 'New Request',
	description: '',
	collectionId: undefined,
	url: '',
	method: 'GET',
	protocol: 'https',
	auth: { type: 'none' },
};

const requestSlice = createSlice({
	name: 'request',
	initialState,
	reducers: {
		setUrl: (state, action: PayloadAction<string>) => {
			state.url = action.payload;
		},
		setMethod: (state, action: PayloadAction<string>) => {
			state.method = action.payload;
		},
		setProtocol: (state, action: PayloadAction<string>) => {
			state.protocol = action.payload;
		},
		setAuth: (state, action: PayloadAction<AuthConfig>) => {
			state.auth = action.payload;
		},
		setRequestState: (state, action: PayloadAction<RequestState>) => {
			return action.payload;
		},
		setName: (state, action: PayloadAction<string>) => {
			state.name = action.payload;
		},
		setActiveRequest: (state, action: PayloadAction<{ request: CollectionRequest; collectionId: string }>) => {
			const { request, collectionId } = action.payload;
			state.id = request.id;
			state.name = request.name;
			state.description = request.description;
			state.url = request.url;
			state.method = request.method;
			state.auth = request.auth || { type: 'none' };
			state.collectionId = collectionId;
		},
		resetRequest: () => {
			return initialState;
		},
	},
});

export const { setUrl, setMethod, setProtocol, setAuth, setRequestState, setName, setActiveRequest, resetRequest } = requestSlice.actions;
export default requestSlice.reducer;
