import { useAppDispatch, RootState } from '@/store/main-store';
import { MainViewState } from '@/types/mainview-state';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { setRequestState } from '@/features/request/requestSlice';
import { setEditorUIState } from '@/features/editor/editorUISlice';

export const useStateRestoration = ({
	initialState,
	onStatePersist,
}: {
	initialState: MainViewState | undefined;
	onStatePersist: (state: MainViewState) => void;
}) => {
	const dispatch = useAppDispatch();
	const [isRestored, setIsRestored] = useState(false);

	// Redux state selectors
	const request = useSelector((state: RootState) => state.request);
	const ui = useSelector((state: RootState) => state.ui);

	// ============================================================================
	// RESTORATION (On Mount)
	// ============================================================================

	useEffect(() => {
		if (!initialState) {
			setIsRestored(true);
			return;
		}
		// Restore each slice
		if (initialState.ui) {
			dispatch(setEditorUIState(initialState.ui));
		}
		if (initialState.request) {
			dispatch(setRequestState(initialState.request));
		}
		setIsRestored(true);
	}, [dispatch, initialState]);

	// ============================================================================
	// PERSISTENCE (On State Change)
	// ============================================================================

	useEffect(() => {
		// Don't save until initial restoration is complete
		if (!isRestored) return;

		const currentState: MainViewState = {
			request,
			ui,
		};

		onStatePersist(currentState);
	}, [isRestored, onStatePersist, request, ui]);

	// ============================================================================
	// RETURN API
	// ============================================================================

	return { isRestored };
};
