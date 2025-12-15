// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { AuthConfig } from '@/shared/types/auth';
// import { RequestBodyConfig } from '@/shared/types/body';
// import { Param } from '@/shared/types/request';

// export interface RequestEditorState {
// 	id: string;
// 	name: string;
// 	collectionId: string;
// 	description: string;
// 	url: string;
// 	method: string;
// 	auth: AuthConfig;
// 	params: Param[];
// 	headers: Param[];
// 	body: RequestBodyConfig;
// }

// const initialState: RequestEditorState = {
// 	id: '',
// 	name: 'New Request',
// 	collectionId: '',
// 	description: '',
// 	url: '',
// 	method: 'GET',
// 	auth: { type: 'none' },
// 	params: [],
// 	headers: [],
// 	body: { type: 'none', formData: [], urlEncoded: [], raw: {}, binary: {}, graphql: {} },
// };

// const requestEditorSlice = createSlice({
// 	name: 'requestEditor',
// 	initialState,
// 	reducers: {
// 		setId: (state, action: PayloadAction<string>) => {
// 			state.id = action.payload;
// 		},
// 		setUrl: (state, action: PayloadAction<string>) => {
// 			state.url = action.payload;
// 		},
// 		setMethod: (state, action: PayloadAction<string>) => {
// 			state.method = action.payload;
// 		},
// 		setAuth: (state, action: PayloadAction<AuthConfig>) => {
// 			state.auth = action.payload;
// 		},
// 		setParams: (state, action: PayloadAction<Param[]>) => {
// 			state.params = action.payload;
// 		},
// 		setHeaders: (state, action: PayloadAction<Param[]>) => {
// 			state.headers = action.payload;
// 		},
// 		setBody: (state, action: PayloadAction<RequestBodyConfig>) => {
// 			state.body = action.payload;
// 		},
// 		setCollectionId: (state, action: PayloadAction<string>) => {
// 			state.collectionId = action.payload;
// 		},
// 		setDescription: (state, action: PayloadAction<string>) => {
// 			state.description = action.payload;
// 		},
// 		setActiveRequest: (state, action: PayloadAction<{ request: RequestEditorState }>) => {
// 			const { request } = action.payload;
// 			state.id = request.id;
// 			state.name = request.name;
// 			state.description = request.description;
// 			state.url = request.url;
// 			state.method = request.method;
// 			state.auth = request.auth || { type: 'none' };
// 			state.collectionId = request.collectionId;
// 			state.params = request.params;
// 			state.headers = request.headers;
// 			state.body = request.body;
// 		},
// 		resetRequestEditor: () => {
// 			return initialState;
// 		},
// 	},
// });

// export const { setId, setUrl, setMethod, setAuth, setParams, setHeaders, setBody, setCollectionId, setDescription, resetRequestEditor } =
// 	requestEditorSlice.actions;

// export default requestEditorSlice.reducer;

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthConfig } from '@/shared/types/auth';
import {
	RequestBody,
	FormDataBody,
	createDefaultRequestBody,
	BinaryBody,
	RawBody,
	GraphQLBody,
	KeyValuePair,
	isFormDataBody,
	isUrlEncodedBody,
	isRawBody,
	isBinaryBody,
	isGraphQLBody,
} from '@/shared/types/body';
import { Param } from '@/shared/types/request';
import { BodyType } from '@/shared/types';

/**
 * Request Editor State
 * Contains ONLY the data that represents the HTTP request
 * This state gets:
 * - Sent to the API when executing request
 * - Saved to collection when persisting
 * - Serialized for state restoration
 */
export interface RequestState {
	// Metadata (for saved requests)
	id?: string;
	name: string;
	description?: string;
	collectionId?: string;

	// HTTP Request Configuration
	url: string;
	method: string;
	protocol: string;
	auth: AuthConfig;

	// Query Parameters
	params: Param[];

	// Request Headers
	headers: Param[];

	// Request Body
	body: RequestBody;
}

const initialState: RequestState = {
	// Metadata
	id: undefined,
	name: 'New Request',
	description: '',
	collectionId: undefined,

	// HTTP config
	url: '',
	method: 'GET',
	protocol: 'https',
	auth: { type: 'none' },

	// Params & Headers (with default empty row for UX)
	params: [{ key: '', value: '', checked: false }],
	headers: [{ key: '', value: '', checked: false }],

	// Body
	body: createDefaultRequestBody(),
};

const requestSlice = createSlice({
	name: 'request',
	initialState,
	reducers: {
		// ============================================================================
		// METADATA REDUCERS
		// ============================================================================
		setId: (state, action: PayloadAction<string | undefined>) => {
			state.id = action.payload;
		},
		setName: (state, action: PayloadAction<string>) => {
			state.name = action.payload;
		},
		setDescription: (state, action: PayloadAction<string>) => {
			state.description = action.payload;
		},
		setCollectionId: (state, action: PayloadAction<string | undefined>) => {
			state.collectionId = action.payload;
		},

		// ============================================================================
		// HTTP REQUEST CONFIG REDUCERS
		// ============================================================================
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

		// ============================================================================
		// PARAMS REDUCERS
		// ============================================================================
		setParams: (state, action: PayloadAction<Param[]>) => {
			state.params = action.payload;
		},

		// ============================================================================
		// HEADERS REDUCERS
		// ============================================================================
		setHeaders: (state, action: PayloadAction<Param[]>) => {
			state.headers = action.payload;
		},

		// ============================================================================
		// BODY REDUCERS
		// ============================================================================
		setBodyConfig: (state, action: PayloadAction<RequestBody>) => {
			state.body = action.payload;
		},
		setBodyType: (state, action: PayloadAction<BodyType>) => {
			const targetType = action.payload;

			// Create fresh variant based on target type
			switch (targetType) {
				case 'none':
					state.body = { type: 'none' };
					break;
				case 'form-data':
					state.body = {
						type: 'form-data',
						formData: [{ key: '', value: '', checked: false, type: 'text' }],
					};
					break;
				case 'x-www-form-urlencoded':
					state.body = {
						type: 'x-www-form-urlencoded',
						urlEncoded: [{ key: '', value: '', checked: false }],
					};
					break;
				case 'raw':
					state.body = {
						type: 'raw',
						raw: { content: '', language: 'json', autoFormat: true },
					};
					break;
				case 'binary':
					state.body = {
						type: 'binary',
						binary: {},
					};
					break;
				case 'graphql':
					state.body = {
						type: 'graphql',
						graphql: { query: '', variables: '', operationName: '' },
					};
					break;
			}
		},
		setFormData: (state, action: PayloadAction<FormDataBody[]>) => {
			if (isFormDataBody(state.body)) {
				state.body.formData = action.payload;
			}
		},
		setUrlEncoded: (state, action: PayloadAction<KeyValuePair[]>) => {
			if (isUrlEncodedBody(state.body)) {
				state.body.urlEncoded = action.payload;
			}
		},

		setRawBody: (state, action: PayloadAction<RawBody>) => {
			if (isRawBody(state.body)) {
				state.body.raw = action.payload;
			}
		},

		setBinaryBody: (state, action: PayloadAction<BinaryBody>) => {
			if (isBinaryBody(state.body)) {
				state.body.binary = action.payload;
			}
		},

		setGraphQLBody: (state, action: PayloadAction<GraphQLBody>) => {
			if (isGraphQLBody(state.body)) {
				state.body.graphql = action.payload;
			}
		},

		setGraphQLOperationName: (state, action: PayloadAction<string>) => {
			if (state.body.type === 'graphql') {
				state.body.graphql.operationName = action.payload;
			}
		},

		setRequestState: (state, action: PayloadAction<RequestState>) => {
			return action.payload;
		},

		// ============================================================================
		// COMPOSITE REDUCERS
		// ============================================================================

		/**
		 * Load complete request from collection
		 * Converts backend format (objects) to frontend format (arrays)
		 */
		loadRequest: (
			state,
			action: PayloadAction<{
				request: {
					id: string;
					name: string;
					description?: string;
					url: string;
					method: string;
					auth?: AuthConfig;
					params?: Record<string, string>;
					headers?: Record<string, string>;
					body?: any;
				};
				collectionId: string;
			}>
		) => {
			const { request, collectionId } = action.payload;

			// Metadata
			state.id = request.id;
			state.name = request.name;
			state.description = request.description || '';
			state.collectionId = collectionId;

			// Request config
			state.url = request.url;
			state.method = request.method;
			state.auth = request.auth || { type: 'none' };

			// Convert params from object to array
			if (request.params && Object.keys(request.params).length > 0) {
				state.params = Object.entries(request.params).map(([key, value]) => ({
					key,
					value,
					checked: true,
				}));
				state.params.push({ key: '', value: '', checked: false });
			} else {
				state.params = [{ key: '', value: '', checked: false }];
			}

			// Convert headers from object to array
			if (request.headers && Object.keys(request.headers).length > 0) {
				state.headers = Object.entries(request.headers).map(([key, value]) => ({
					key,
					value,
					checked: true,
				}));
				state.headers.push({ key: '', value: '', checked: false });
			} else {
				state.headers = [{ key: '', value: '', checked: false }];
			}

			// Body
			if (request.body) {
				if (typeof request.body === 'object' && 'type' in request.body) {
					// Already a discriminated union - use as is
					state.body = request.body as RequestBody;
				} else {
					state.body = createDefaultRequestBody();
				}
			} else {
				state.body = createDefaultRequestBody();
			}
		},

		/**
		 * Reset to initial state (new request)
		 */
		resetRequest: () => {
			return initialState;
		},
	},
});

/**
 * Async thunk for handling file selection in form-data
 */
export const updateFormDataWithFiles = createAsyncThunk(
	'request/updateFormDataWithFiles',
	async ({ paths, index }: { paths: string[]; index: number }, { getState, dispatch }) => {
		const state = getState() as { request: RequestState };
		const body = state.request.body;

		if (!isFormDataBody(body)) {
			console.warn('Cannot update files: body is not form-data type');
			return;
		}

		const currentFormData = body.formData;
		const newFormData = [...currentFormData];
		const originalField = newFormData[index];
		const key = originalField.key || '';

		const newFields = paths.map((p: string) => {
			const fileName = p.split('\\').pop()!.split('/').pop()!;
			return {
				key: key,
				value: p,
				fileName: fileName,
				type: 'file' as 'file',
				checked: true,
			};
		});

		newFormData.splice(index, 1, ...newFields);
		dispatch(setFormData(newFormData));
	}
);

export const {
	// Metadata
	setId,
	setName,
	setDescription,
	setCollectionId,

	// Request config
	setUrl,
	setMethod,
	setProtocol,
	setAuth,

	// Params & Headers
	setParams,
	setHeaders,

	// Body
	setBodyConfig,
	setBodyType,
	setFormData,
	setUrlEncoded,
	setRawBody,
	setBinaryBody,
	setGraphQLBody,
	setGraphQLOperationName,
	setRequestState,

	// Composite
	loadRequest,
	resetRequest,
} = requestSlice.actions;

export default requestSlice.reducer;
