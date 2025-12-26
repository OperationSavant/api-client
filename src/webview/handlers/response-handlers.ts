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
			const errorResponse: Response = {
				status: 0,
				statusText: 'Error',
				headers: {},
				body: message?.error,
				contentType: 'text/plain',
				size: message?.error.length,
				duration: 0,
				isError: true,
				error: message?.error,
			};
			dispatch(setResponse(errorResponse));
			dispatch(setIsExecuting(false));
			return;
		}

		const enhancedResponseData: Response = {
			status: message.status,
			statusText: message.statusText,
			headers: message.headers,
			body: message.body,
			contentType: message.headers['content-type'] || message.headers['Content-Type'] || 'text/plain',
			size: message.size,
			duration: message.duration,
			isError: message.isError,
			error: message.isError ? `HTTP Error: ${message.status}` : undefined,
			isLargeBody: message.isLargeBody,
			bodyFilePath: message.bodyFilePath,
		};
		dispatch(setResponse(enhancedResponseData));
		dispatch(setIsExecuting(false));
	};

	return {
		handleApiResponse,
	};
}
