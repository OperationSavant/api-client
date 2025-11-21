// hooks/useRequestExecution.ts
import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { RootState } from '@/store';
import { arrayToRecord } from '@/shared/lib/utils';

export const useRequestExecution = ({
	onLoadingChange,
	onResponseClear,
	sendToBackend,
}: {
	onLoadingChange: (loading: boolean) => void;
	onResponseClear: () => void;
	sendToBackend: (message: any) => void;
}) => {
	const { url, protocol, method, auth } = useSelector((state: RootState) => state.request);
	const { params } = useSelector((state: RootState) => state.requestParams);
	const { headers } = useSelector((state: RootState) => state.requestHeaders);
	const { config: bodyConfig } = useSelector((state: RootState) => state.requestBody);

	const executeRequest = useCallback(async () => {
		onLoadingChange(true);
		onResponseClear();

		const requestUrl = url.trim();
		if (!requestUrl) {
			onLoadingChange(false);
			return;
		}

		let fullUrl = requestUrl;
		if (!requestUrl.includes('://')) {
			fullUrl = `${protocol}://${requestUrl}`;
		}

		sendToBackend({
			source: 'webview',
			command: 'sendRequest',
			url: fullUrl,
			method,
			bodyConfig,
			headers: arrayToRecord(headers),
			params: arrayToRecord(params),
			auth,
		});
	}, [url, method, headers, params, auth, bodyConfig, onLoadingChange, onResponseClear, sendToBackend]);

	return { executeRequest };
};
