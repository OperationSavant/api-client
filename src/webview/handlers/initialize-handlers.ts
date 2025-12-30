import type { AppDispatch } from '@/store/main-store';
import { setCollections } from '@/features/collections/main-collectionsSlice';
import { loadRequest } from '@/features/request/requestSlice';
import type { Collection } from '@/shared/types/collection';
import type { Request } from '@/shared/types/request';

interface InitializeHandlerDependencies {
	dispatch: AppDispatch;
	onInitialized: () => void;
}

export function createInitializeHandlers({ dispatch, onInitialized }: InitializeHandlerDependencies) {
	const handleInitialize = (payload: {
		collections: Collection[];
		environments: [];
		metadata: { request: Request & { id: string; name: string }; collectionId: string };
	}) => {
		if (payload !== null && payload !== undefined && payload?.collections?.length) {
			dispatch(setCollections(payload.collections || []));
		}
		if (payload.metadata) {
			dispatch(loadRequest({ request: payload.metadata.request, collectionId: payload.metadata.collectionId }));
		}
		onInitialized();
	};

	return {
		handleInitialize,
	};
}
