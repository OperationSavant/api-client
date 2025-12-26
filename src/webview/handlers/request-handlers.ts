import type { AppDispatch } from '@/store/main-store';
import { resetRequest } from '@/features/request/requestSlice';

interface RequestHandlerDependencies {
	dispatch: AppDispatch;
}

export function createRequestHandlers({ dispatch }: RequestHandlerDependencies) {
	const handleResetState = () => {
		dispatch(resetRequest());
	};

	return {
		// handleLoadRequest,
		handleResetState,
	};
}
