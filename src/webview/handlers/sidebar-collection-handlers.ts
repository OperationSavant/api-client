import { addCollection, setCollections } from '@/features/collections/sidebar-collectionSlice';
import type { Collection } from '@/shared/types/collection';
import type { AppDispatch } from '@/store/sidebar-store';

interface SidebarCollectionHandlerDependencies {
	dispatch: AppDispatch;
}

export function createSidebarCollectionHandlers({ dispatch }: SidebarCollectionHandlerDependencies) {
	const handleAddCollection = (data: Collection) => {
		if (data) {
			dispatch(addCollection(data));
		}
	};

	const handleSetCollections = (data: Collection[]) => {
		if (data && Array.isArray(data)) {
			dispatch(setCollections(data));
		}
	};

	return {
		handleAddCollection,
		handleSetCollections,
	};
}
