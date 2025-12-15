import { AppDispatch } from '@/store/sidebar-store';
import { setCollections } from '@/features/collections/sidebar-collectionSlice';
import { setHistory } from '@/features/history/sidebar-historySlice';

interface InitializeHandlerDependencies {
	dispatch: AppDispatch;
}

export function createSidebarInitializeHandlers(deps: InitializeHandlerDependencies) {
	const handleInitialize = (payload: any) => {
		if (payload !== null && payload !== undefined) {
			if (Array.isArray(payload.collections)) {
				deps.dispatch(setCollections(payload.collections));
			}
			if (Array.isArray(payload.history)) {
				deps.dispatch(setHistory(payload.history));
			}
		}
	};

	return {
		handleInitialize,
	};
}
