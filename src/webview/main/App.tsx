import { useRef, useEffect, useMemo, useCallback } from 'react';
import { vscode } from '@/vscode';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { ImperativePanelGroupHandle } from 'react-resizable-panels';
import { ResponseViewer } from '@/components/response/response-viewer';
import { useAppDispatch } from '@/store/main-store';
import {
	createInitializeHandlers,
	createResponseHandlers,
	createCollectionHandlers,
	createRequestHandlers,
	createFileHandlers,
	createOAuth2Handlers,
} from '@/handlers';
import { useWebviewMessaging } from '@/hooks/useWebviewMessaging';
import { useWebviewInitialization } from '@/hooks/useStateRestoration';
import { LoadingFallback } from '@/components/custom/states/loading-fallback';
import { RequestViewer } from '@/components/request/request-viewer';
import { createThemeHandlers } from '@/handlers/theme-handlers';
import { setIsExecuting } from '@/features/editor/editorUISlice';

const App = () => {
	const dispatch = useAppDispatch();
	const messaging = useWebviewMessaging();
	const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
	const { isReady, isInitialized, markReady, markInitialized } = useWebviewInitialization();

	const sendToExtension = useCallback((message: any) => {
		vscode.postMessage(message);
	}, []);

	const initializeHandlers = useMemo(() => createInitializeHandlers({ dispatch, onInitialized: markInitialized }), [dispatch, markInitialized]);
	const responseHandlers = useMemo(() => createResponseHandlers({ dispatch }), [dispatch]);
	const collectionHandlers = useMemo(() => createCollectionHandlers({ dispatch }), [dispatch]);
	const requestHandlers = useMemo(() => createRequestHandlers({ dispatch }), [dispatch]);
	const fileHandlers = useMemo(() => createFileHandlers({ dispatch }), [dispatch]);
	const themeHandlers = useMemo(() => createThemeHandlers(), []);
	const oauth2Handlers = useMemo(() => createOAuth2Handlers({ dispatch }), [dispatch]);

	useEffect(() => {
		if (isReady) {
			sendToExtension({ source: 'webview', command: 'webviewReady' });
		}
	}, [isReady, sendToExtension]);

	useEffect(() => {
		const handleError = () => {
			dispatch(setIsExecuting(false));
		};
		messaging.registerHandler('initialize', initializeHandlers.handleInitialize);
		messaging.registerHandler('apiResponse', responseHandlers.handleApiResponse);
		messaging.registerHandler('addCollection', collectionHandlers.handleAddCollection);
		messaging.registerHandler('setCollections', collectionHandlers.handleSetCollections);
		messaging.registerHandler('resetState', requestHandlers.handleResetState);
		messaging.registerHandler('formDataFileResponse', fileHandlers.handleFormDataFileResponse);
		messaging.registerHandler('binaryFileResponse', fileHandlers.handleBinaryFileResponse);
		messaging.registerHandler('themeData', themeHandlers.handleThemeData);
		messaging.registerHandler('oauth2TokenResponse', oauth2Handlers.handleOAuth2TokenResponse);
		messaging.registerHandler('error', handleError);
		markReady();

		return () => {
			messaging.unregisterHandler('initialize');
			messaging.unregisterHandler('apiResponse');
			messaging.unregisterHandler('addCollection');
			messaging.unregisterHandler('setCollections');
			messaging.unregisterHandler('resetState');
			messaging.unregisterHandler('formDataFileResponse');
			messaging.unregisterHandler('binaryFileResponse');
			messaging.unregisterHandler('themeData');
			messaging.unregisterHandler('oauth2TokenResponse');
			messaging.unregisterHandler('error');
		};
	}, [messaging, initializeHandlers, responseHandlers, collectionHandlers, requestHandlers, fileHandlers, themeHandlers, oauth2Handlers, markReady, dispatch]);

	if (!isInitialized) {
		return <LoadingFallback message={'Restoring session...'} description={'Please wait while we restore your previous workspace state'} />;
	}

	return (
		<div className='flex flex-col h-screen bg-background text-foreground py-2'>
			<ResizablePanelGroup direction='vertical' ref={panelGroupRef}>
				<ResizablePanel defaultSize={60} minSize={10}>
					<div className='flex flex-col h-full px-2 gap-4'>
						<RequestViewer sendToExtension={sendToExtension} />
					</div>
				</ResizablePanel>
				<ResizableHandle withHandle className='bg-primary h-0.5 hover:bg-primary hover:h-1' />
				<ResizablePanel defaultSize={40} minSize={5}>
					<div className='h-full w-full py-2 px-2'>
						<ResponseViewer sendToExtension={sendToExtension} panelGroupRef={panelGroupRef} />
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
};

export default App;

