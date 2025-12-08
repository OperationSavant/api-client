import { AppDispatch } from '@/store/main-store';
import { setCollections } from '@/features/collections/main-collectionsSlice';

interface InitializeHandlerDependencies {
	dispatch: AppDispatch;
}

export function createInitializeHandlers(deps: InitializeHandlerDependencies) {
	const handleInitialize = (payload: any) => {
		if (payload !== null && payload !== undefined && payload?.collections?.length) {
			deps.dispatch(setCollections(payload.collections || []));
		}
	};

	return {
		handleInitialize,
	};
}
