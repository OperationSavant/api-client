import { useCallback } from 'react';
import { ApiClientRequestBar } from '../custom/app/api-client-request-bar';
import { REQUEST_TABS_CONFIG } from '@/config/tabs/tabs-config';
import type { RequestTabContext } from '@/shared/types/tabs';
import type { AuthConfig, OAuth2Auth } from '@/shared/types/auth';
import ApiClientTabs from '../custom/api-client-tabs';
import type { RootState} from '@/store/main-store';
import { useAppDispatch } from '@/store/main-store';
import { useSelector } from 'react-redux';
import { setAuth, setMethod, setUrl } from '@/features/request/requestSlice';
import { setActiveRequestTab, setIsExecuting, setIsSaveDialogOpen } from '@/features/editor/editorUISlice';
import { useRequestExecution } from '@/hooks/useRequestExecution';
import { clearResponse } from '@/features/response/responseSlice';
import { ApiClientSaveRequestDialog } from '../custom/app/api-client-save-request-dialog';
import type { SaveRequestPayload } from '@/shared/types/collection';

interface RequestViewProps {
	sendToExtension: (message: any) => void;
}

export const RequestViewer = ({ sendToExtension }: RequestViewProps) => {
	const dispatch = useAppDispatch();
	const { executeRequest } = useRequestExecution({
		onLoadingChange: (isLoading: boolean) => dispatch(setIsExecuting(isLoading)),
		onResponseClear: () => dispatch(clearResponse()),
		sendToBackend: sendToExtension,
	});

	const {
		ui: { activeRequestTab, isExecuting, isSaveDialogOpen },
		request: { url, method, auth },
	} = useSelector((state: RootState) => state);

	const handleGenerateOAuth2Token = useCallback(
		async (oauth2Config: OAuth2Auth) => {
			sendToExtension({
				source: 'webview',
				command: 'generateOAuth2Token',
				oauth2Config,
			});
		},
		[sendToExtension]
	);

	const handleSelectFile = useCallback(
		(index: number) => {
			sendToExtension({ source: 'webview', command: 'formDataFileRequest', index });
		},
		[sendToExtension]
	);

	const handleSelectBinaryFile = useCallback(() => {
		sendToExtension({ source: 'webview', command: 'binaryFileRequest' });
	}, [sendToExtension]);

	const handleSaveRequest = useCallback(
		(payload: SaveRequestPayload) => {
			sendToExtension({ source: 'webview', command: 'saveRequest', payload });
			dispatch(setIsSaveDialogOpen(false));
		},
		[sendToExtension, dispatch]
	);

	const handleCreateCollection = useCallback(
		(name: string) => {
			sendToExtension({ source: 'webview', command: 'createCollection', name });
		},
		[sendToExtension]
	);

	const tabContext: RequestTabContext = {
		auth,
		onAuthChange: (auth: AuthConfig) => dispatch(setAuth(auth)),
		onGenerateOAuth2Token: handleGenerateOAuth2Token,
		onSelectFile: handleSelectFile,
		onSelectBinaryFile: handleSelectBinaryFile,
	};

	return (
		<>
			<div className='shrink-0'>
				<ApiClientRequestBar
					method={method}
					url={url}
					onMethodChange={newMethod => dispatch(setMethod(newMethod))}
					onUrlChange={newUrl => dispatch(setUrl(newUrl))}
					onSend={executeRequest}
					onSaveClick={() => dispatch(setIsSaveDialogOpen(true))}
					loading={isExecuting}
					placeholder='Enter URL or paste text'
					onDownloadClick={() => {}}
				/>
			</div>
			<ApiClientTabs
				tabs={REQUEST_TABS_CONFIG}
				context={tabContext}
				value={activeRequestTab}
				onChange={tab => dispatch(setActiveRequestTab(tab))}
				className='flex-1 flex flex-col min-h-0'
				contentClassName='flex-1 min-h-0'
			/>
			<ApiClientSaveRequestDialog
				isOpen={isSaveDialogOpen}
				onClose={() => dispatch(setIsSaveDialogOpen(false))}
				onSave={handleSaveRequest}
				onCreateCollection={handleCreateCollection}
			/>
		</>
	);
};
