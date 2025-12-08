import { useState, useEffect } from 'react';
import { useAppDispatch, RootState } from '@/store/sidebar-store';
import { SidebarViewState } from '@/types/sidebarview-state';
import { useSelector } from 'react-redux';
import { setCollectionState } from '@/features/collections/sidebar-collectionSlice';

export const useSidebarStateRestoration = ({
	initialState,
	onStatePersist,
}: {
	initialState: SidebarViewState | undefined;
	onStatePersist: (state: SidebarViewState) => void;
}) => {
	const dispatch = useAppDispatch();
	const [isRestored, setIsRestored] = useState(false);

	// Redux state selectors
	const collectionState = useSelector((state: RootState) => state.sidebarCollections);

	// ============================================================================
	// RESTORATION (On Mount)
	// ============================================================================

	useEffect(() => {
		if (!initialState) {
			setIsRestored(true);
			return;
		}
		// Restore each slice
		if (initialState.collections) {
			dispatch(setCollectionState(initialState.collections));
		}
		setIsRestored(true);
	}, [dispatch, initialState]);

	// ============================================================================
	// PERSISTENCE (On State Change)
	// ============================================================================

	useEffect(() => {
		// Don't save until initial restoration is complete
		if (!isRestored) return;

		const currentState: SidebarViewState = {
			collections: collectionState,
		};

		onStatePersist(currentState);
	}, [isRestored, onStatePersist, collectionState]);

	// ============================================================================
	// RETURN API
	// ============================================================================

	return { isRestored };
};
