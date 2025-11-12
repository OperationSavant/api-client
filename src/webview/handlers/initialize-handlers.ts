import { setActiveRequest, setAuth, setMethod, setUrl } from '@/features/request/requestSlice';
import { setBodyConfig } from '@/features/requestBody/requestBodySlice';
import { setHeaders } from '@/features/requestHeaders/requestHeadersSlice';
import { setParams } from '@/features/requestParams/requestParamsSlice';
import { AppDispatch } from '@/store';
import { Param } from '@/shared/types/request';

interface InitializeHandlerDependencies {
	dispatch: AppDispatch;
}

export function createInitializeHandlers(deps: InitializeHandlerDependencies) {
	const handleInitialize = (payload: any) => {
		console.log('Webview initialized with payload:', payload);

		if (!payload?.request) {
			console.warn('Invalid loadRequest data:', payload);
			return;
		}

		deps.dispatch(setActiveRequest(payload));

		// Convert headers object to array
		const headersArray: Param[] = [];
		if (payload.request.headers) {
			if (Object.keys(payload.request.headers).length === 0) {
				headersArray.push({ key: '', value: '', checked: false });
			} else {
				for (const key in payload.request.headers) {
					if (Object.prototype.hasOwnProperty.call(payload.request.headers, key)) {
						headersArray.push({ key, value: payload.request.headers[key], checked: true });
					}
				}
				headersArray.push({ key: '', value: '', checked: false });
			}
		}
		deps.dispatch(setHeaders(headersArray));
		const paramsArray: Param[] = [];
		if (payload.request.params) {
			if (Object.keys(payload.request.params).length === 0) {
				paramsArray.push({ key: '', value: '', checked: false });
			} else {
				for (const key in payload.request.params) {
					if (Object.prototype.hasOwnProperty.call(payload.request.params, key)) {
						paramsArray.push({ key, value: payload.request.params[key], checked: true });
					}
				}
				paramsArray.push({ key: '', value: '', checked: false });
			}
		}
		deps.dispatch(setParams(paramsArray));

		if (payload.request.body) {
			deps.dispatch(setBodyConfig(payload.request.body));
		}
		// if (payload.request.method) {
		// 	deps.dispatch(setMethod(payload.request.method));
		// }
		// if (payload.request.url) {
		// 	deps.dispatch(setUrl(payload.request.url));
		// }
		// if (payload.request.auth) {
		// 	deps.dispatch(setAuth(payload.request.auth));
		// }
	};

	return {
		handleInitialize,
	};
}
