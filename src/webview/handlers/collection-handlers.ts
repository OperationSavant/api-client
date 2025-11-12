import { addCollection, setCollections } from '@/features/collections/collectionsSlice';
import { AppDispatch } from '@/store';

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
		if (data && Array.isArray(data)) {
			deps.dispatch(setCollections(data));
		}
	};

	return {
		handleAddCollection,
		handleSetCollections,
	};
}
