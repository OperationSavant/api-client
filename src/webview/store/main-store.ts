import { useDispatch } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import requestReducer from '@/features/request/requestSlice';
import editorUIReducer from '@/features/editor/editorUISlice';
import responseReducer from '@/features/response/responseSlice';
import collectionsReducer from '@/features/collections/main-collectionsSlice';

export const mainStore = configureStore({
	reducer: {
		request: requestReducer,
		ui: editorUIReducer,
		response: responseReducer,
		collection: collectionsReducer,
	},
});

export type RootState = ReturnType<typeof mainStore.getState>;
export type AppDispatch = typeof mainStore.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
