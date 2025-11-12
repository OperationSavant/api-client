import { useDispatch } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import requestParamsReducer from '@/features/requestParams/requestParamsSlice';
import requestHeadersReducer from '@/features/requestHeaders/requestHeadersSlice';
import requestBodyReducer from '@/features/requestBody/requestBodySlice';
import requestReducer from '@/features/request/requestSlice';
import requestUIReducer from '@/features/request/requestUISlice';
import collectionsReducer from '@/features/collections/collectionsSlice';
import cookiesReducer from '@/features/cookies/cookiesSlice';

export const store = configureStore({
	reducer: {
		request: requestReducer,
		requestParams: requestParamsReducer,
		requestHeaders: requestHeadersReducer,
		requestBody: requestBodyReducer,
		requestUI: requestUIReducer,
		collections: collectionsReducer,
		cookies: cookiesReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
