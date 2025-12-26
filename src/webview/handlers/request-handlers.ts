import { AppDispatch } from '@/store/main-store';
import { loadRequest, resetRequest } from '@/features/request/requestSlice';

interface RequestHandlerDependencies {
	dispatch: AppDispatch;
}

export function createRequestHandlers({ dispatch }: RequestHandlerDependencies) {
	// const handleLoadRequest = (payload: { tabId: string; request: { request: any; collectionId: string } }) => {
	// 	if (!payload?.request || !payload?.request?.collectionId) {
	// 		console.warn('Invalid loadRequest data:', payload);
	// 		return;
	// 	}
	// 	dispatch(loadRequest(payload?.request));
	// };

	const handleResetState = () => {
		dispatch(resetRequest());
	};

	return {
		// handleLoadRequest,
		handleResetState,
	};
}
