// hooks/useRequestExecution.ts
import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { RootState } from '@/store/main-store';
import { arrayToRecord } from '@/shared/lib/utils';
import { assembleBodyForExecution, mergeContentTypeHeader } from '@/shared/lib/body-assembler';

export const useRequestExecution = ({
	onLoadingChange,
	onResponseClear,
	sendToBackend,
}: {
	onLoadingChange: (loading: boolean) => void;
	onResponseClear: () => void;
	sendToBackend: (message: any) => void;
}) => {
	const request = useSelector((state: RootState) => state.request);

	const executeRequest = useCallback(async () => {
		onLoadingChange(true);
		onResponseClear();

		const requestUrl = request.url.trim();
		if (!requestUrl) {
			onLoadingChange(false);
			return;
		}

		let fullUrl = requestUrl;
		if (!requestUrl.includes('://')) {
			fullUrl = `${request.protocol}://${requestUrl}`;
		}

		const assemblyResult = assembleBodyForExecution(request.body, request.headers);
		const finalHeaders = mergeContentTypeHeader(request.headers, assemblyResult);

		sendToBackend({
			source: 'webview',
			command: 'sendRequest',
			url: fullUrl,
			method: request.method,
			bodyConfig: assemblyResult.body,
			headers: arrayToRecord(finalHeaders),
			params: arrayToRecord(request.params),
			auth: request.auth,
		});
	}, [request, onLoadingChange, onResponseClear, sendToBackend]);

	return { executeRequest };
};
