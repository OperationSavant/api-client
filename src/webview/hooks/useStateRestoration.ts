import { setRequestState } from '@/features/request/requestSlice';
import { setCurrentTab } from '@/features/request/requestUISlice';
import { setBodyConfig } from '@/features/requestBody/requestBodySlice';
import { setHeaders } from '@/features/requestHeaders/requestHeadersSlice';
import { setParams } from '@/features/requestParams/requestParamsSlice';
import { useAppDispatch, RootState } from '@/store';
import { WebviewState } from '@/shared/types/state';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

export const useStateRestoration = ({
	initialState,
	onStatePersist,
}: {
	initialState: WebviewState | undefined;
	onStatePersist: (state: WebviewState) => void;
}) => {
	const dispatch = useAppDispatch();
	const [isRestored, setIsRestored] = useState(false);

	// Redux state selectors
	const requestState = useSelector((state: RootState) => state.request);
	const paramsState = useSelector((state: RootState) => state.requestParams);
	const headersState = useSelector((state: RootState) => state.requestHeaders);
	const bodyState = useSelector((state: RootState) => state.requestBody);
	const requestUIState = useSelector((state: RootState) => state.requestUI);
	const collectionsState = useSelector((state: RootState) => state.collections);

	// ============================================================================
	// RESTORATION (On Mount)
	// ============================================================================

	useEffect(() => {
		if (!initialState) {
			setIsRestored(true);
			return;
		}
		// Restore each slice
		if (initialState.requestUI) {
			dispatch(setCurrentTab(initialState.requestUI.currentTab));
		}
		if (initialState.request) {
			dispatch(setRequestState(initialState.request));
		}
		if (initialState.requestParams?.params) {
			dispatch(setParams(initialState.requestParams.params));
		}
		if (initialState.requestHeaders?.headers) {
			dispatch(setHeaders(initialState.requestHeaders.headers));
		}
		if (initialState.requestBody?.config) {
			dispatch(setBodyConfig(initialState.requestBody.config));
		}
		// if (initialState.collections && Array.isArray(initialState.collections)) {
		// 	dispatch(setCollections(initialState.collections));
		// }
		setIsRestored(true);
	}, [dispatch, initialState]);

	// ============================================================================
	// PERSISTENCE (On State Change)
	// ============================================================================

	useEffect(() => {
		// Don't save until initial restoration is complete
		if (!isRestored) return;

		const currentState: WebviewState = {
			requestUI: requestUIState,
			request: requestState,
			requestParams: paramsState,
			requestHeaders: headersState,
			requestBody: bodyState,
			collections: collectionsState,
		};
		console.log('🚀 ~ useStateRestoration ~ currentState:', currentState);

		onStatePersist(currentState);
	}, [isRestored, onStatePersist, requestUIState, requestState, paramsState, headersState, bodyState, collectionsState]);

	// ============================================================================
	// RETURN API
	// ============================================================================

	return { isRestored };
};
