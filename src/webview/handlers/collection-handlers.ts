import { addCollection, setCollections } from '@/features/collections/main-collectionsSlice';
import { AppDispatch } from '@/store/main-store';

interface CollectionHandlerDependencies {
	dispatch: AppDispatch;
}

export function createCollectionHandlers(deps: CollectionHandlerDependencies) {
	const handleAddCollection = (data: any) => {
		if (data) {
			deps.dispatch(addCollection(data));
		}
	};

	const handleSetCollections = (data: any) => {
		if (data && data.collections && Array.isArray(data.collections)) {
			deps.dispatch(setCollections(data.collections));
		}
	};

	return {
		handleAddCollection,
		handleSetCollections,
	};
}
