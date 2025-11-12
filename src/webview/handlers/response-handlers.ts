import { Response } from '@/shared/types/response';
// import { CookieIntegration } from '@/services/cookie-integration'; // TODO:Temporarily disable cookie integration due to folder restructure
import { RootState } from '@/store';

interface ResponseHandlerDependencies {
	setResponseData: (data: Response | null) => void;
	setLoading: (loading: boolean) => void;
	// cookieIntegration: CookieIntegration;
	getState: () => RootState;
}

export function createResponseHandlers({ setResponseData, setLoading, getState }: ResponseHandlerDependencies) {
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
			setResponseData(errorResponse);
			setLoading(false);
			return;
		}

		// if (httpResponse.headers) {
		// 	let requestUrl = url.trim() || 'api.example.com/data';
		// 	requestUrl = requestUrl.replace(/^https?:\/\//, '');
		// 	const fullRequestUrl = `${protocol}://${requestUrl}`;

		// 	try {
		// 		// cookieIntegration.processResponse(httpResponse, fullRequestUrl);
		// 	} catch (error) {
		// 		console.warn('Failed to process cookies from response:', error);
		// 	}
		// }
		// let responseBodyString: string;
		// if (message.isLargeBody) {
		// 	responseBodyString = '';
		// } else if (typeof httpResponse === 'string') {
		// 	responseBodyString = httpResponse;
		// } else if (httpResponse !== null && httpResponse !== undefined) {
		// 	responseBodyString = httpResponse.data;
		// } else {
		// 	responseBodyString = '';
		// }
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
		setResponseData(enhancedResponseData);
		setLoading(false);
	};

	return {
		handleApiResponse,
	};
}
