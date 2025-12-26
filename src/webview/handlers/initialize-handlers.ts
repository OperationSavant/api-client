import { AppDispatch } from '@/store/main-store';
import { setCollections } from '@/features/collections/main-collectionsSlice';
import { loadRequest } from '@/features/request/requestSlice';

interface InitializeHandlerDependencies {
	dispatch: AppDispatch;
	onInitialized: () => void;
}

export function createInitializeHandlers({ dispatch, onInitialized }: InitializeHandlerDependencies) {
	const handleInitialize = (payload: any) => {
		if (payload !== null && payload !== undefined && payload?.collections?.length) {
			dispatch(setCollections(payload.collections || []));
		}
		if (payload.request) {
			dispatch(loadRequest({ request: payload.request, collectionId: payload.collectionId }));
		}
		onInitialized();
	};

	return {
		handleInitialize,
	};
}
