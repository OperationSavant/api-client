import { setIsExecuting } from '@/features/editor/editorUISlice';
import { setResponse } from '@/features/response/responseSlice';
import type { Response } from '@/shared/types/response';
import type { AppDispatch } from '@/store/main-store';

interface ResponseHandlerDependencies {
	dispatch: AppDispatch;
}

export function createResponseHandlers({ dispatch }: ResponseHandlerDependencies) {
	const handleApiResponse = (message: Response) => {
		if (message?.error) {
			dispatch(setResponse(message));
			dispatch(setIsExecuting(false));
			return;
		}
		dispatch(setResponse(message));
		dispatch(setIsExecuting(false));
	};

	return {
		handleApiResponse,
	};
}
