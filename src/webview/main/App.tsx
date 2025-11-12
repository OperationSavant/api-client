import { vscode } from '../vscode';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ImperativePanelGroupHandle } from 'react-resizable-panels';
import { ResponseViewer } from '@/components/response/response-viewer';
// import { CookieIntegration } from '@/services/cookie-integration';
// import { cookieService } from '@/services/cookie-service';
import { ApiClientRequestBar } from '@/components/custom/app/api-client-request-bar';
import { useSelector } from 'react-redux';
import { RootState, store, useAppDispatch } from '@/store';
import { setAuth, setMethod, setUrl } from '@/features/request/requestSlice';
import { setCurrentTab } from '@/features/request/requestUISlice';
import { SaveRequestPayload } from '@/shared/types/collection';
import { ApiClientSaveRequestDialog } from '@/components/custom/app/api-client-save-request-dialog';
import { AuthConfig, OAuth2Auth } from '@/shared/types/auth';
import ApiClientTabs from '@/components/custom/api-client-tabs';
import { REQUEST_TABS_CONFIG } from '@/config/tabs/tabs-config';
import { PanelState, Response } from '@/shared/types/response';
import {
	createResponseHandlers,
	createCollectionHandlers,
	createRequestHandlers,
	createFileHandlers,
	createThemeHandlers,
	createOAuth2Handlers,
} from '@/handlers';
import { useWebviewMessaging } from '@/hooks/useWebviewMessaging';
import { WebviewState } from '@/shared/types/state';
import { useStateRestoration } from '@/hooks/useStateRestoration';
import { useRequestExecution } from '@/hooks/useRequestExecution';
import { RequestTabContext } from '@/shared/types/tabs';
// import { useCookieOperations } from '@/hooks/useCookieOperations';
import { LoadingFallback } from '@/components/custom/states/loading-fallback';
import { EmptyState } from '@/components/custom/states/empty-state';
import { Send } from 'lucide-react';
import { createInitializeHandlers } from '@/handlers/initialize-handlers';

const App = () => {
	const dispatch = useAppDispatch();
	const messaging = useWebviewMessaging();
	const [loading, setLoading] = useState(false);
	const [responseData, setResponseData] = useState<Response | null>(null);
	const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
	// const cookieIntegration = useRef(new CookieIntegration(cookieService));

	const [responsePanelState, setResponsePanelState] = useState<PanelState>('default');
	const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);

	const {
		requestUI: { currentTab },
		request: { url, method, auth },
	} = useSelector((state: RootState) => state);

	// const { cookies, addCookie, updateCookie, deleteCookie, deleteAllCookies, importCookies, exportCookies } = useCookieOperations();

	const initialState = useMemo(() => vscode.getState<WebviewState>(), []);
	const getReduxState = useCallback(() => store.getState(), []);

	const sendToExtension = useCallback((message: any) => {
		vscode.postMessage(message);
	}, []);

	const { executeRequest } = useRequestExecution({
		// cookieIntegration: cookieIntegration.current,
		cookieIntegration: null, // TODO:Temporarily disable cookie integration due to folder restructure
		onLoadingChange: setLoading,
		onResponseClear: () => setResponseData(null),
		sendToBackend: sendToExtension,
	});

	const persistState = useCallback((state: WebviewState) => {
		vscode.setState(state);
	}, []);

	const { isRestored } = useStateRestoration({
		initialState,
		onStatePersist: persistState,
	});

	const handleGenerateOAuth2Token = useCallback(
		async (oauth2Config: OAuth2Auth) => {
			sendToExtension({
				command: 'generateOAuth2Token',
				oauth2Config,
			});
		},
		[sendToExtension]
	);

	const handleSelectFile = useCallback(
		(index: number) => {
			sendToExtension({ command: 'formDataFileRequest', index });
		},
		[sendToExtension]
	);

	const handleSelectBinaryFile = useCallback(() => {
		sendToExtension({ command: 'binaryFileRequest' });
	}, [sendToExtension]);

	const handleOpenFileInEditor = useCallback(
		(filePath: string) => {
			sendToExtension({ command: 'openFileInEditor', filePath });
		},
		[sendToExtension]
	);

	const handleCreateCollection = useCallback(
		(name: string) => {
			sendToExtension({ command: 'createCollection', name });
		},
		[sendToExtension]
	);

	const handleToggleResponsePanel = useCallback(() => {
		const panelGroup = panelGroupRef.current;
		if (!panelGroup) return;

		switch (responsePanelState) {
			case 'default':
				panelGroup.setLayout([10, 90]); // Maximize response panel
				setResponsePanelState('maximized');
				break;
			case 'maximized':
				panelGroup.setLayout([95, 5]); // Minimize response panel
				setResponsePanelState('minimized');
				break;
			case 'minimized':
				panelGroup.setLayout([60, 40]); // Reset to default
				setResponsePanelState('default');
				break;
		}
	}, [responsePanelState]);

	const initializeHandlers = useMemo(() => createInitializeHandlers({ dispatch }), [dispatch]);

	const responseHandlers = useMemo(
		() =>
			createResponseHandlers({
				setResponseData,
				setLoading,
				// cookieIntegration: cookieIntegration.current, // TODO:Temporarily disable cookie integration due to folder restructure
				getState: getReduxState,
			}),
		[getReduxState]
	);

	const collectionHandlers = useMemo(() => createCollectionHandlers({ dispatch }), [dispatch]);

	const requestHandlers = useMemo(() => createRequestHandlers({ dispatch }), [dispatch]);

	const fileHandlers = useMemo(() => createFileHandlers({ dispatch }), [dispatch]);

	const themeHandlers = useMemo(() => createThemeHandlers(), []);
	const oauth2Handlers = useMemo(() => createOAuth2Handlers({ dispatch, getState: getReduxState }), [dispatch, getReduxState]);

	const tabContext: RequestTabContext = {
		auth,
		onAuthChange: (auth: AuthConfig) => dispatch(setAuth(auth)),
		onGenerateOAuth2Token: handleGenerateOAuth2Token,
		onSelectFile: handleSelectFile,
		onSelectBinaryFile: handleSelectBinaryFile,
		// cookies,
		// onAddCookie: addCookie,
		// onUpdateCookie: updateCookie,
		// onDeleteCookie: deleteCookie,
		// onDeleteAllCookies: deleteAllCookies,
		// onImportCookies: importCookies,
		// onExportCookies: exportCookies,
	};

	useEffect(() => {
		if (isRestored) {
			sendToExtension({ command: 'webviewReady' });
		}
	}, [isRestored]);

	useEffect(() => {
		messaging.registerHandler('initialize', initializeHandlers.handleInitialize);
		messaging.registerHandler('apiResponse', responseHandlers.handleApiResponse);
		messaging.registerHandler('addCollection', collectionHandlers.handleAddCollection);
		messaging.registerHandler('setCollections', collectionHandlers.handleSetCollections);
		messaging.registerHandler('loadRequest', requestHandlers.handleLoadRequest);
		messaging.registerHandler('resetState', requestHandlers.handleResetState);
		messaging.registerHandler('formDataFileResponse', fileHandlers.handleFormDataFileResponse);
		messaging.registerHandler('binaryFileResponse', fileHandlers.handleBinaryFileResponse);
		messaging.registerHandler('themeData', themeHandlers.handleThemeData);
		messaging.registerHandler('oauth2TokenResponse', oauth2Handlers.handleOAuth2TokenResponse);

		return () => {
			messaging.unregisterHandler('initialize');
			messaging.unregisterHandler('apiResponse');
			messaging.unregisterHandler('addCollection');
			messaging.unregisterHandler('setCollections');
			messaging.unregisterHandler('loadRequest');
			messaging.unregisterHandler('resetState');
			messaging.unregisterHandler('formDataFileResponse');
			messaging.unregisterHandler('binaryFileResponse');
			messaging.unregisterHandler('themeData');
			messaging.unregisterHandler('oauth2TokenResponse');
		};
	}, [messaging, responseHandlers, collectionHandlers, requestHandlers, fileHandlers, themeHandlers, oauth2Handlers]);

	const handleSaveRequest = useCallback(
		(payload: SaveRequestPayload) => {
			sendToExtension({ command: 'saveRequest', payload });
			setIsSaveDialogOpen(false);
		},
		[sendToExtension]
	);

	// Show loading state until session is restored
	if (!isRestored) {
		return <LoadingFallback message='Restoring session...' description='Please wait while we restore your previous workspace state' />;
	}

	return (
		<div className='flex flex-col h-screen bg-secondary text-foreground'>
			<ResizablePanelGroup direction='vertical' ref={panelGroupRef}>
				<ResizablePanel defaultSize={60} minSize={10}>
					<div className='flex flex-col h-full px-2 gap-4'>
						<div className='shrink-0'>
							<ApiClientRequestBar
								method={method}
								url={url}
								onMethodChange={newMethod => dispatch(setMethod(newMethod))}
								onUrlChange={newUrl => dispatch(setUrl(newUrl))}
								onSend={executeRequest}
								onSaveClick={() => setIsSaveDialogOpen(true)}
								loading={loading}
								placeholder='Enter URL or paste text'
								onDownloadClick={() => {}}
							/>
						</div>
						<ApiClientTabs
							tabs={REQUEST_TABS_CONFIG}
							context={tabContext}
							value={currentTab}
							onChange={tab => dispatch(setCurrentTab(tab))}
							className='flex-1 flex flex-col min-h-0'
							contentClassName='flex-1 min-h-0'
						/>
					</div>
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={40} minSize={5}>
					<div className='h-full w-full'>
						<ResponseViewer
							response={responseData}
							isLoading={loading}
							onOpenFileInEditor={handleOpenFileInEditor}
							onTogglePanelSize={handleToggleResponsePanel}
							panelState={responsePanelState}
						/>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
			<ApiClientSaveRequestDialog
				isOpen={isSaveDialogOpen}
				onClose={() => setIsSaveDialogOpen(false)}
				onSave={handleSaveRequest}
				onCreateCollection={handleCreateCollection}
			/>
		</div>
	);
};

export default App;

