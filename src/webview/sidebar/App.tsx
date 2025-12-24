import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientButtonGroup } from '@/components/custom/api-client-button-group';
import { ApiClientSelect } from '@/components/custom/api-client-select';
import ApiClientTabs from '@/components/custom/api-client-tabs';
import { Separator } from '@/components/ui/separator';
import { useWebviewMessaging } from '@/hooks/useWebviewMessaging';
import { useAppDispatch } from '@/store/sidebar-store';
import { vscode } from '@/vscode';
import { SidebarViewState } from '@/types/sidebarview-state';
import { useSidebarStateRestoration } from '@/hooks/useSidebarStateRestoration';
import { LoadingFallback } from '@/components/custom/states/loading-fallback';
import { createSidebarInitializeHandlers, createSidebarCollectionHandlers, createSidebarHistoryHandlers } from '@/handlers';
import { SidebarTabContext, TabConfig } from '@/shared/types/tabs';
import { CollectionTab } from '@/components/collections/collection-tab';
import { FolderTree, Layers, History } from 'lucide-react';
import HistoryTab from '@/components/history/history-tab';

export const SIDEBAR_TABS_CONFIG: TabConfig[] = [
	{ id: 'collections', label: 'Collections', component: CollectionTab, icon: FolderTree },
	{ id: 'environments', label: 'Environments', icon: Layers },
	{ id: 'history', label: 'History', component: HistoryTab, icon: History },
];

const App = () => {
	const dispatch = useAppDispatch();
	const messaging = useWebviewMessaging();
	const initialState = useMemo(() => vscode.getState<SidebarViewState>(), []);

	const [currentTab, setCurrentTab] = useState('collections');

	const sendToExtension = useCallback((message: any) => {
		vscode.postMessage(message);
	}, []);

	const persistState = useCallback((state: SidebarViewState) => {
		vscode.setState(state);
	}, []);

	const { isRestored } = useSidebarStateRestoration({
		initialState,
		onStatePersist: persistState,
	});

	const initializeHandlers = useMemo(() => createSidebarInitializeHandlers({ dispatch }), [dispatch]);
	const collectionHandlers = useMemo(() => createSidebarCollectionHandlers({ dispatch }), [dispatch]);
	const historyHandlers = useMemo(() => createSidebarHistoryHandlers({ dispatch }), [dispatch]);

	useEffect(() => {
		if (isRestored) {
			sendToExtension({ source: 'webviewView', command: 'sidebarReady' });
		}
	}, [isRestored]);

	useEffect(() => {
		messaging.registerHandler('initializeDataFromExtension', initializeHandlers.handleInitialize);
		messaging.registerHandler('setCollections', collectionHandlers.handleSetCollections);
		messaging.registerHandler('setHistory', historyHandlers.handleSetHistory);
		messaging.registerHandler('historyItemAdded', historyHandlers.handleAddHistoryItem);
		messaging.registerHandler('historyItemRemoved', historyHandlers.handleRemoveHistoryItem);
		messaging.registerHandler('historyCleared', historyHandlers.handleClearHistory);

		return () => {
			messaging.unregisterHandler('initializeDataFromExtension');
			messaging.unregisterHandler('setCollections');
			messaging.unregisterHandler('setHistory');
			messaging.unregisterHandler('historyItemAdded');
			messaging.unregisterHandler('historyItemRemoved');
			messaging.unregisterHandler('historyCleared');
		};
	}, [messaging, initializeHandlers, collectionHandlers, historyHandlers]);

	const tabContext: SidebarTabContext = {
		sendToExtension,
	};

	const handleOpenRequest = useCallback((requestId?: string) => {
		sendToExtension({
			command: 'createNewRequest',
			commandId: 'apiClient.openRequest',
			args: requestId ? [requestId] : [],
			source: 'webviewView',
		});
	}, []);

	if (!isRestored) {
		return <LoadingFallback message='Restoring session...' description='Please wait while we restore your previous workspace state' />;
	}

	return (
		<div className='flex flex-col h-screen w-full bg-sidebar text-sidebar-foreground gap-4 py-2 overflow-y-hidden'>
			<div className='flex w-full px-2'>
				<ApiClientSelect
					classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
					classNameContent={`w-full`}
					placeholder='Select workspace'
					options={[
						{ value: 'workspace1', label: 'Workspace 1' },
						{ value: 'workspace2', label: 'Workspace 2' },
					]}
				/>
			</div>
			<div className='flex w-full px-2'>
				<ApiClientButtonGroup size={'lg'} className='w-full' label='New HTTP Request' onClick={() => handleOpenRequest()} />
			</div>
			<Separator orientation='horizontal' />
			<div className='grow flex flex-col w-full px-2 justify-between min-h-0'>
				<ApiClientTabs
					value={currentTab}
					context={tabContext}
					tabs={SIDEBAR_TABS_CONFIG}
					className='flex-1 flex flex-col min-h-0 w-full'
					listClassName='w-full! justify-between w-full'
					contentClassName='flex-1 min-h-0 w-full'
					onChange={tab => setCurrentTab(tab)}
				/>
			</div>
		</div>
	);
};

export default App;
