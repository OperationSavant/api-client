import { resetRequest, setActiveRequest } from '@/features/request/requestSlice';
import { setHeaders } from '@/features/requestHeaders/requestHeadersSlice';
import { setParams } from '@/features/requestParams/requestParamsSlice';
import { setBodyConfig } from '@/features/requestBody/requestBodySlice';
import { Param } from '@/shared/types/request';
import { createDefaultRequestBody } from '@/shared/types/body';
import { AppDispatch } from '@/store';

interface RequestHandlerDependencies {
	dispatch: AppDispatch;
}

export function createRequestHandlers(deps: RequestHandlerDependencies) {
	const handleLoadRequest = (payload: any) => {
		if (!payload?.request || !payload?.collectionId) {
			console.warn('Invalid loadRequest data:', payload);
			return;
		}

		deps.dispatch(setActiveRequest(payload));

		// Convert headers object to array
		const headersArray: Param[] = [];
		if (payload.request.headers) {
			for (const key in payload.request.headers) {
				if (Object.prototype.hasOwnProperty.call(payload.request.headers, key)) {
					headersArray.push({ key, value: payload.request.headers[key], checked: true });
				}
			}
		}
		deps.dispatch(setHeaders(headersArray));
		const paramsArray: Param[] = [];
		if (payload.request.params) {
			for (const key in payload.request.params) {
				if (Object.prototype.hasOwnProperty.call(payload.request.params, key)) {
					paramsArray.push({ key, value: payload.request.params[key], checked: true });
				}
			}
		}
		deps.dispatch(setParams(paramsArray));

		if (payload.request.body) {
			deps.dispatch(setBodyConfig(payload.request.body));
		}
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
