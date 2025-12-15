import { useDispatch } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import collectionsReducer from '@/features/collections/sidebar-collectionSlice';
import historyReducer from '@/features/history/sidebar-historySlice';

export const sidebarStore = configureStore({
	reducer: {
		sidebarCollections: collectionsReducer,
		sidebarHistory: historyReducer,
	},
});

export type RootState = ReturnType<typeof sidebarStore.getState>;
export type AppDispatch = typeof sidebarStore.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
