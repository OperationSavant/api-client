import type { AppDispatch } from '@/store/main-store';
import { setCollections } from '@/features/collections/main-collectionsSlice';
import { loadRequest } from '@/features/request/requestSlice';
import type { Collection } from '@/shared/types/collection';
import type { Request } from '@/shared/types/request';
import { setPreviewUrl } from '@/features/editor/editorUISlice';

interface InitializeHandlerDependencies {
	dispatch: AppDispatch;
	onInitialized: () => void;
}

export function createInitializeHandlers({ dispatch, onInitialized }: InitializeHandlerDependencies) {
	const handleInitialize = (payload: {
		collections: Collection[];
		environments: [];
		metadata: { request: Request & { id: string; name: string }; collectionId: string };
		previewContainerUri: string | null;
	}) => {
		if (payload !== null && payload !== undefined && payload?.collections?.length) {
			dispatch(setCollections(payload.collections || []));
		}
		if (payload.metadata) {
			dispatch(loadRequest({ request: payload.metadata.request, collectionId: payload.metadata.collectionId }));
		}
		if (payload.previewContainerUri) {
			dispatch(setPreviewUrl(payload.previewContainerUri));
		}
		onInitialized();
	};

	return {
		handleInitialize,
	};
}
