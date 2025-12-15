import { addCollection, setCollections } from '@/features/collections/sidebar-collectionSlice';
import { AppDispatch } from '@/store/sidebar-store';

interface SidebarCollectionHandlerDependencies {
	dispatch: AppDispatch;
}

export function createSidebarCollectionHandlers(deps: SidebarCollectionHandlerDependencies) {
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
