import { Param } from '@/shared/types/request';
import { createDefaultRequestBody } from '@/shared/types/body';
import { AppDispatch } from '@/store/main-store';
import { loadRequest, resetRequest, setBodyConfig, setHeaders, setParams } from '@/features/request/requestSlice';

interface RequestHandlerDependencies {
	dispatch: AppDispatch;
}

export function createRequestHandlers(deps: RequestHandlerDependencies) {
	const handleLoadRequest = (payload: { tabId: string; request: { request: any; collectionId: string } }) => {
		if (!payload?.request || !payload?.request?.collectionId) {
			console.warn('Invalid loadRequest data:', payload);
			return;
		}
		deps.dispatch(loadRequest(payload?.request));
	};

	const handleResetState = () => {
		deps.dispatch(resetRequest());
		deps.dispatch(setParams([]));
		deps.dispatch(setHeaders([]));
		deps.dispatch(setBodyConfig(createDefaultRequestBody()));
	};

	return {
		handleLoadRequest,
		handleResetState,
	};
}
