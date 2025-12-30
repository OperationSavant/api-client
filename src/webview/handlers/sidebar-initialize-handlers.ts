import type { AppDispatch } from '@/store/sidebar-store';
import { setCollections } from '@/features/collections/sidebar-collectionSlice';
import { setHistory } from '@/features/history/sidebar-historySlice';
import type { Collection } from '@/shared/types/collection';
import type { HistoryItem } from '@/shared/types/history';

interface InitializeHandlerDependencies {
	dispatch: AppDispatch;
	onInitialized: () => void;
}

export function createSidebarInitializeHandlers({ dispatch, onInitialized }: InitializeHandlerDependencies) {
	const handleInitialize = (payload: { collections?: Collection[]; history?: HistoryItem[] }) => {
		if (payload !== null && payload !== undefined) {
			if (Array.isArray(payload.collections)) {
				dispatch(setCollections(payload.collections));
			}
			if (Array.isArray(payload.history)) {
				dispatch(setHistory(payload.history));
			}
			onInitialized();
		}
	};

	return {
		handleInitialize,
	};
}
