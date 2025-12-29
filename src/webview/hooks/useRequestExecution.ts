// hooks/useRequestExecution.ts
import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { RootState } from '@/store/main-store';
import { arrayToRecord } from '@/shared/lib/utils';
import { assembleBodyForExecution, mergeContentTypeHeader } from '@/shared/lib/body-assembler';
import type { MessageEnvelope } from '@/shared/types/webview-messages';
import { CLIENT_COMMANDS } from '@/shared/constants/commands';
import type { Request } from '@/shared/types/request';

export const useRequestExecution = ({
	onLoadingChange,
	onResponseClear,
	sendToExtension,
}: {
	onLoadingChange: (loading: boolean) => void;
	onResponseClear: () => void;
	sendToExtension: (message: MessageEnvelope) => void;
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

		sendToExtension({
			source: 'webview',
			command: CLIENT_COMMANDS.SEND_REQUEST,
			payload: {
				url: fullUrl,
				method: request.method,
				body: assemblyResult.body,
				headers: arrayToRecord(finalHeaders),
				params: arrayToRecord(request.params),
				auth: request.auth,
			} as Request,
		});
	}, [request, onLoadingChange, onResponseClear, sendToExtension]);

	return { executeRequest };
};
