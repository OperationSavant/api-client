import { addCollection, setCollections } from '@/features/collections/main-collectionsSlice';
import type { Collection } from '@/shared/types/collection';
import type { AppDispatch } from '@/store/main-store';

interface CollectionHandlerDependencies {
	dispatch: AppDispatch;
}

export function createCollectionHandlers(deps: CollectionHandlerDependencies) {
	//TODO: Need to check if this handler is even called from anywhere
	const handleAddCollection = (data: any) => {
		if (data) {
			deps.dispatch(addCollection(data));
		}
	};

	const handleSetCollections = (data: Collection[]) => {
		if (data && Array.isArray(data)) {
			deps.dispatch(setCollections(data));
		}
	};

	return {
		handleAddCollection,
		handleSetCollections,
	};
}
