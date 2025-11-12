import { RootState } from '@/store';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	BinaryBodyConfig,
	createDefaultRequestBody,
	FormDataField,
	GraphQLBodyConfig,
	KeyValuePair,
	RawBodyConfig,
	RequestBodyConfig,
} from '@/shared/types/body';
import { BodyType } from '@/shared/types';

export interface RequestBodyState {
	config: RequestBodyConfig;
}

const initialState: RequestBodyState = {
	config: createDefaultRequestBody(),
};

export const updateFormDataWithFiles = createAsyncThunk(
	'requestBody/updateFormDataWithFiles',
	async ({ paths, index }: { paths: string[]; index: number }, { getState, dispatch }) => {
		const state = getState() as RootState;
		const currentFormData = state.requestBody.config.formData;

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

const requestBodySlice = createSlice({
	name: 'requestBody',
	initialState,
	reducers: {
		loadRequest: {
			reducer: (state, action: PayloadAction<RequestBodyConfig>) => {
				state.config = action.payload;
			},
			prepare: (body: any) => {
				const newBodyConfig: RequestBodyConfig = {
					...createDefaultRequestBody(),
					type: 'raw',
					raw: {
						content: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
						language: 'json',
						autoFormat: true,
					},
				};
				return { payload: newBodyConfig };
			},
		},
		setBodyConfig: (state, action: PayloadAction<RequestBodyConfig>) => {
			state.config = action.payload;
		},
		setBodyType: (state, action: PayloadAction<BodyType>) => {
			state.config.type = action.payload;
			if (action.payload === 'form-data' && state.config.formData.length === 0) {
				state.config.formData.push({ key: '', value: '', checked: false, type: 'text' });
			} else if (action.payload === 'x-www-form-urlencoded' && state.config.urlEncoded.length === 0) {
				state.config.urlEncoded.push({ key: '', value: '', checked: false });
			}
		},
		setFormData: (state, action: PayloadAction<FormDataField[]>) => {
			state.config.formData = action.payload;
		},
		setUrlEncoded: (state, action: PayloadAction<KeyValuePair[]>) => {
			state.config.urlEncoded = action.payload;
		},
		setRawBody: (state, action: PayloadAction<RawBodyConfig>) => {
			state.config.raw = action.payload;
		},
		setBinaryBody: (state, action: PayloadAction<BinaryBodyConfig>) => {
			state.config.binary = action.payload;
		},
		setGraphQLBody: (state, action: PayloadAction<GraphQLBodyConfig>) => {
			state.config.graphql = action.payload;
		},
		setGraphQLOperationName: (state, action: PayloadAction<string>) => {
			if (state.config.type === 'graphql') {
				state.config.graphql.operationName = action.payload;
			}
		},
	},
});

export const { setBodyConfig, setBodyType, setFormData, setUrlEncoded, setRawBody, setBinaryBody, setGraphQLBody, setGraphQLOperationName, loadRequest } =
	requestBodySlice.actions;
export default requestBodySlice.reducer;
