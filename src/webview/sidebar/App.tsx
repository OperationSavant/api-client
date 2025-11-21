import { ApiClientButtonGroup } from '@/components/custom/api-client-button-group';
import { ApiClientSelect } from '@/components/custom/api-client-select';
import ApiClientTabs from '@/components/custom/api-client-tabs';
import TreeView from '@/components/custom/api-client-tree-view';
import { Separator } from '@/components/ui/separator';
import { TabConfig } from '@/shared/types/tabs';
import { vscode } from '@/vscode';
import { History, Layers, FolderTree } from 'lucide-react';
import { useCallback } from 'react';

const CollectionTab = () => {
	return (
		<div className='flex flex-col gap-4 h-full'>
			<TreeView />
		</div>
	);
};

const App = () => {
	const tabContext = {};

	const handleOpenRequest = useCallback((requestId?: string) => {
		console.log('Opening new HTTP Request...');
		vscode.postMessage({
			command: 'executeCommand',
			commandId: 'apiClient.openRequest',
			args: requestId ? [requestId] : [],
			source: 'webviewView',
		});
	}, []);

	const TABS_CONFIG: TabConfig[] = [
		{ id: 'collections', label: 'Collections', component: CollectionTab, icon: FolderTree },
		{ id: 'environments', label: 'Environments', icon: Layers },
		{ id: 'history', label: 'History', icon: History },
	];

	return (
		<div className='flex flex-col h-screen bg-(--vscode-activityBar-background) text-foreground gap-4 px-2 overflow-y-hidden'>
			<div className='flex w-full'>
				<ApiClientSelect classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`} classNameContent={`w-full`} placeholder='Select workspace' />
			</div>
			<div className='flex w-full'>
				<ApiClientButtonGroup size={'lg'} className='w-full' buttonText='New HTTP Request' onClick={() => handleOpenRequest()} />
			</div>
			<Separator orientation='horizontal' />
			<div className='grow flex flex-col w-full justify-between min-h-0'>
				<ApiClientTabs
					context={tabContext}
					tabs={TABS_CONFIG}
					className='flex-1 flex flex-col min-h-0'
					listClassName='w-full! justify-between'
					contentClassName='flex-1 min-h-0'
				/>
			</div>
		</div>
	);
};

export default App;
