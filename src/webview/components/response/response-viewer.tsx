import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Maximize2, Minimize2, ChevronsUpDown, ExternalLink, Send, AlignStartVertical, TextSelect, TestTube, Cookie } from 'lucide-react';
import type { Response } from '@/shared/types/response';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { LoadingFallback } from '../custom/states/loading-fallback';
import { EmptyState } from '../custom/states/empty-state';
import { cn } from '@/shared/lib/utils';
import ApiClientTabs from '../custom/api-client-tabs';
import type { ResponseTabContext, TabConfig } from '@/shared/types/tabs';
import type { RootState } from '@/store/main-store';
import { useAppDispatch } from '@/store/main-store';
import { useSelector } from 'react-redux';
import { setActiveResponseTab, setResponsePanelSize } from '@/features/editor/editorUISlice';
import ResponseBodyTab from './response-body-tab';
import ResponseHeaderTab from './response-header-tab';
import type { MessageEnvelope } from '@/shared/types/webview-messages';
import { CLIENT_COMMANDS } from '@/shared/constants/commands';
import type { ImperativePanelGroupHandle } from 'react-resizable-panels';
import { ErrorState } from '../custom/states/error-state';

interface ResponseViewerProps {
	sendToExtension: (message: MessageEnvelope) => void;
	panelGroupRef: React.RefObject<ImperativePanelGroupHandle | null>;
	onToggleResponsePanel?: () => void;
	className?: string;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ sendToExtension, panelGroupRef, onToggleResponsePanel, className = '' }) => {
	const dispatch = useAppDispatch();
	const {
		ui: { isExecuting, responsePanelSize, activeResponseTab },
		response,
	} = useSelector((state: RootState) => state);

	if (isExecuting) {
		return (
			<div className={cn(`flex flex-col h-full`, className)} data-testid='response-viewer-container'>
				<LoadingFallback message='Please wait...' description='Please wait while the request is executed...' />
			</div>
		);
	}

	if (!response) {
		return (
			<div className={cn(`flex flex-col h-full`, className)} data-testid='response-viewer-container'>
				<EmptyState icon={Send} title='No response yet' description='Send a request to see the response here' className='m-auto' />
			</div>
		);
	}

	const tabContext: ResponseTabContext = {
		sendToExtension,
		response,
		responsePanelSize,
		panelGroupRef,
		onToggleResponsePanel,
		headers: response.headers || {},
	};

	const RESPONSE_TABS_CONFIG: TabConfig[] = [
		{ id: 'body', label: 'Body', component: ResponseBodyTab, testId: 'response-body-tab', icon: TextSelect },
		{ id: 'headers', label: 'Headers', component: ResponseHeaderTab, testId: 'response-headers-tab', icon: AlignStartVertical },
		{ id: 'cookies', label: 'Cookies', component: undefined, testId: 'response-cookies-tab', icon: Cookie },
		{ id: 'tests', label: 'Tests', component: undefined, testId: 'response-tests-tab', icon: TestTube },
	];

	return (
		<div className={cn(`flex flex-col h-full`, className)} data-testid='response-viewer-container'>
			{response.isError && <ErrorState title='Error' errorDescription={response.error} errorContent={response.body} className='m-auto' />}
			{!response.isError && response.body && (
				<ApiClientTabs
					tabs={RESPONSE_TABS_CONFIG}
					context={tabContext}
					value={activeResponseTab}
					onChange={value => dispatch(setActiveResponseTab(value))}
					className='flex-1 flex flex-col min-h-0'
					contentClassName='flex-1 min-h-0'
				/>
			)}
		</div>
	);
};

export default ResponseViewer;

