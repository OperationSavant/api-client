import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Maximize2, Minimize2, ChevronsUpDown, ExternalLink, Send, AlignStartVertical, TextSelect, TestTube, Cookie } from 'lucide-react';
import { Response } from '@/shared/types/response';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { LoadingFallback } from '../custom/states/loading-fallback';
import { EmptyState } from '../custom/states/empty-state';
import { ApiClientTable } from '../custom/api-client-kvp';
import { cn, recordToArray } from '@/shared/lib/utils';
import ApiClientTabs from '../custom/api-client-tabs';
import { ResponseTabContext, TabConfig } from '@/shared/types/tabs';
import { RootState, useAppDispatch } from '@/store/main-store';
import { useSelector } from 'react-redux';
import { setActiveResponseTab, setResponsePanelSize } from '@/features/editor/editorUISlice';
import ResponseBodyTab from './response-body-tab';
import ResponseHeaderTab from './response-header-tab';

interface ResponseViewerProps {
	sendToExtension: (message: any) => void;
	panelGroupRef: React.RefObject<any>;
	className?: string;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ sendToExtension, panelGroupRef, className = '' }) => {
	const dispatch = useAppDispatch();
	const {
		ui: { isExecuting, responsePanelSize, activeResponseTab },
		response,
	} = useSelector((state: RootState) => state);

	const handleOpenFileInEditor = useCallback(
		(filePath: string) => {
			sendToExtension({ source: 'webview', command: 'openFileInEditor', filePath });
		},
		[sendToExtension]
	);

	const handleToggleResponsePanel = useCallback(() => {
		const panelGroup = panelGroupRef.current;
		if (!panelGroup) return;

		switch (responsePanelSize) {
			case 'default':
				panelGroup.setLayout([10, 90]);
				setResponsePanelSize('maximized');
				break;
			case 'maximized':
				panelGroup.setLayout([95, 5]);
				setResponsePanelSize('minimized');
				break;
			case 'minimized':
				panelGroup.setLayout([60, 40]);
				setResponsePanelSize('default');
				break;
		}
	}, [responsePanelSize]);

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const formatDuration = (ms: number): string => {
		if (ms < 1000) return `${ms} ms`;
		return `${(ms / 1000).toFixed(2)} s`;
	};

	const getStatusColor = (status: number): string => {
		if (status >= 100 && status < 200) return 'bg-blue-500';
		if (status >= 200 && status < 300) return 'bg-green-500';
		if (status >= 300 && status < 400) return 'bg-yellow-500';
		if (status >= 400 && status < 500) return 'bg-red-500';
		if (status >= 500) return 'bg-red-800';
		return 'bg-gray-500';
	};

	const handleDownload = () => {
		if (response) {
			const contentType = response.contentType || '';
			let format = 'text';
			if (contentType.includes('json')) {
				format = 'json';
			} else if (contentType.includes('xml')) {
				format = 'xml';
			} else if (contentType.includes('html')) {
				format = 'html';
			} else if (contentType.includes('css')) {
				format = 'css';
			} else if (contentType.includes('javascript')) {
				format = 'javascript';
			}
			let content = response.body && typeof response.body === 'string' ? response.body : '';
			let filename = 'response';
			let mimeType = 'text/plain';

			switch (format) {
				case 'json':
					content = JSON.stringify(JSON.parse(content), null, 2);
					filename = 'response.json';
					mimeType = 'application/json';
					break;
				case 'xml':
					filename = 'response.xml';
					mimeType = 'application/xml';
					break;
				case 'html':
					filename = 'response.html';
					mimeType = 'text/html';
					break;
				case 'text':
					filename = 'response.txt';
					mimeType = 'text/plain';
					break;
				default:
					filename = `response.${format}`;
			}

			const blob = new Blob([content], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	};

	const handleOpenInEditor = () => {
		if (response?.bodyFilePath && handleOpenFileInEditor) {
			handleOpenFileInEditor(response.bodyFilePath);
		}
	};

	const renderLargeBodyPlaceholder = () => (
		<div className='flex flex-col items-center justify-center h-full text-center p-4'>
			<p className='text-lg font-medium'>Response Body Too Large</p>
			<p className='text-sm text-muted-foreground mb-4'>The response size ({response ? formatBytes(response.size) : ''}) is too large to display inline.</p>
			<Button onClick={handleOpenInEditor}>
				<ExternalLink className='w-4 h-4 mr-2' />
				Open in Editor
			</Button>
		</div>
	);

	const handleCopy = () => {
		if (response && response.body && typeof response.body === 'string') {
			navigator.clipboard.writeText(response.body);
		}
	};

	const ResponseViewerHeader = () => {
		if (!response) return null;
		const PanelIcon = responsePanelSize === 'default' ? Maximize2 : responsePanelSize === 'maximized' ? Minimize2 : ChevronsUpDown;

		return (
			<div className='flex items-center w-full h-full'>
				<div className='flex items-center gap-2'>
					<Label className='text-sm font-medium'>Status:</Label>
					<Badge className={`${getStatusColor(response.status)} text-white`} variant='secondary'>
						{response.status} {response.statusText}
					</Badge>
				</div>
				<Separator orientation='vertical' className='h-4' />
				<div className='flex items-center gap-2'>
					<Label className='text-sm font-medium'>Time:</Label>
					<span className='text-sm text-muted-foreground'>{formatDuration(response.duration)}</span>
				</div>
				<Separator orientation='vertical' className='h-4' />
				<div className='flex items-center gap-2'>
					<Label className='text-sm font-medium'>Size:</Label>
					<span className='text-sm text-muted-foreground'>{formatBytes(response.size)}</span>
				</div>
				<div className='grow' />
				{handleToggleResponsePanel && (
					<Button variant='ghost' size='icon' onClick={handleToggleResponsePanel}>
						<PanelIcon className='w-4 h-4' />
					</Button>
				)}
				<Tabs
					value={activeResponseTab}
					onValueChange={value => setActiveResponseTab(value as 'body' | 'cookies' | 'headers' | 'tests')}
					className='h-full w-full px-4'>
					<TabsList>
						<TabsTrigger value='body'>BODY</TabsTrigger>
						<TabsTrigger value='cookies'>COOKIES</TabsTrigger>
						<TabsTrigger value='headers'>HEADERS</TabsTrigger>
						<TabsTrigger value='tests'>TESTS</TabsTrigger>
					</TabsList>

					<TabsContent value='body' className='flex-1 overflow-hidden h-full'>
						<div className='flex items-center justify-center h-full'>
							{isExecuting ? (
								<LoadingFallback message='Sending request...' description='Please wait while we process your API request' />
							) : (
								<EmptyState icon={Send} title='No response yet' description='Send a request to see the response here' />
							)}
						</div>
					</TabsContent>

					<TabsContent value='cookies' className='flex-1 overflow-hidden h-full'>
						<div className='h-full overflow-hidden'>COOKIES</div>
					</TabsContent>

					<TabsContent value='headers' className='flex-1 overflow-hidden h-full'>
						<div className='h-full overflow-hidden'>HEADERS</div>
					</TabsContent>

					<TabsContent value='tests' className='flex-1 overflow-hidden h-full'>
						<div className='h-full overflow-hidden'>TESTS</div>
					</TabsContent>
				</Tabs>
			</div>
		);
	};

	const renderResponseControls = () => {
		return (
			<div className='flex items-center gap-4 p-3 border-b'>
				{/* <div className='flex items-center gap-2'>
					<Switch id='word-wrap' checked={wordWrap} onCheckedChange={setWordWrap} />
					<Label htmlFor='word-wrap' className='text-sm'>
						Word Wrap
					</Label>
				</div>

				<div className='flex items-center gap-2 ml-auto'>
					<Button variant='outline' size='sm' onClick={handleCopy} disabled={!response?.body} data-testid='copy-button'>
						<Copy className='w-4 h-4 mr-2' />
						Copy
					</Button>
					<Button variant='outline' size='sm' onClick={handleDownload} disabled={!response?.body} data-testid='download-button'>
						<Download className='w-4 h-4 mr-2' />
						Download
					</Button>
					<Button variant='outline' size='sm' onClick={() => setIsFullscreen(!isFullscreen)} data-testid='fullscreen-button'>
						{isFullscreen ? <ShrinkIcon className='w-4 h-4' /> : <ExpandIcon className='w-4 h-4' />}
					</Button>
				</div> */}
			</div>
		);
	};

	const renderLoadingState = () => {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='flex flex-col items-center gap-4'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' role='status' aria-label='Loading'></div>
					<p className='text-sm text-muted-foreground'>Loading response...</p>
				</div>
			</div>
		);
	};

	const renderErrorState = () => {
		if (!response?.isError) return null;

		return (
			<div className='flex items-center justify-center h-64'>
				<div className='flex flex-col items-center gap-4 text-center'>
					<div className='rounded-full bg-red-100 p-3'>
						<div className='w-6 h-6 bg-red-500 rounded-full'></div>
					</div>
					<div>
						<p className='text-sm font-medium text-red-700'>Request Failed</p>
						<p className='text-sm text-red-600'>{response.error || 'An error occurred'}</p>
					</div>
				</div>
			</div>
		);
	};

	const renderEmptyState = () => {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='flex flex-col items-center gap-4 text-center'>
					<div className='rounded-full bg-muted p-3'>
						<div className='w-6 h-6 bg-muted-foreground rounded-full'></div>
					</div>
					<p className='text-sm text-muted-foreground'>Send a request to see the response</p>
				</div>
			</div>
		);
	};

	// const renderResponseBody = (mode: 'raw' | 'formatted') => {
	// 	if (!response?.body) return null;

	// 	// The content is ALWAYS the raw response body.
	// 	const content = response.body;
	// 	let language = 'plaintext';

	// 	// Detect language from content type
	// 	const contentType = response.contentType || '';
	// 	if (contentType.includes('json')) {
	// 		language = 'json';
	// 	} else if (contentType.includes('xml')) {
	// 		language = 'xml';
	// 	} else if (contentType.includes('html')) {
	// 		language = 'html';
	// 	} else if (contentType.includes('css')) {
	// 		language = 'css';
	// 	} else if (contentType.includes('javascript')) {
	// 		language = 'javascript';
	// 	}

	// 	// In 'raw' mode, we don't format. In 'formatted' mode, we tell Monaco to format.
	// 	const shouldFormat = mode === 'formatted';

	// 	return (
	// 		<div className='relative h-full overflow-hidden border border-border rounded-md'>
	// 			<MonacoEditor value={content} language={language} formatOnMount={true} wordWrap={true} height='100%' copyButtonVisible={false} readOnly={true} />
	// 		</div>
	// 	);
	// };

	const renderContent = () => {
		if (isExecuting) return renderLoadingState();
		// if (!response) return renderEmptyState();
		if (response?.isError) return renderErrorState();
		if (response?.isLargeBody) {
			return renderLargeBodyPlaceholder();
		}

		return (
			<div className='h-full flex flex-col'>
				{/* <Tabs value={viewMode} onValueChange={value => setViewMode(value as 'raw' | 'formatted')} className='h-full'>
					<TabsList className='grid w-full grid-cols-2 shrink-0'>
						<TabsTrigger value='formatted'>Formatted</TabsTrigger>
						<TabsTrigger value='raw'>Raw</TabsTrigger>
					</TabsList>

					<TabsContent value='formatted' className='flex-1 overflow-hidden'>
						<div className='h-full overflow-hidden'>{renderResponseBody('formatted')}</div>
					</TabsContent>

					<TabsContent value='raw' className='flex-1 overflow-hidden'>
						<div className='h-full overflow-hidden'>{renderResponseBody('raw')}</div>
					</TabsContent>
				</Tabs> */}
			</div>
		);
	};

	const formatResponseToHex = (response: Response) => {
		if (!response?.body) return '';
	};

	const responseBodyTabComponent = () => {};

	const responseHeaderTabComponent = (headers: Record<string, string>) => {};

	// const responseComponent = () => {
	// 	const PanelIcon = responsePanelSize === 'default' ? Maximize2 : responsePanelSize === 'maximized' ? Minimize2 : ChevronsUpDown;
	// 	const headers = response?.headers || {};

	// 	return (
	// 		<div className='h-full flex flex-col bg-background'>
	// 			<div className='flex flex-row justify-between items-center h-full w-full'>
	// 				<div className='flex h-full w-full'></div>
	// 			</div>
	// 		</div>
	// 	);
	// };

	const tabContext: ResponseTabContext = {
		responseBody: response?.body || '',
		contentType: response?.contentType || '',
		headers: response?.headers || {},
		handleCopy,
	};

	const RESPONSE_TABS_CONFIG: TabConfig[] = [
		{ id: 'body', label: 'Body', component: ResponseBodyTab, testId: 'response-body-tab', icon: TextSelect },
		{ id: 'headers', label: 'Headers', component: ResponseHeaderTab, testId: 'response-headers-tab', icon: AlignStartVertical },
		{ id: 'cookies', label: 'Cookies', component: undefined, testId: 'response-cookies-tab', icon: Cookie },
		{ id: 'tests', label: 'Tests', component: undefined, testId: 'response-tests-tab', icon: TestTube },
	];

	return (
		<div className={cn(`flex flex-col h-full`, className)} data-testid='response-viewer-container'>
			<ApiClientTabs
				tabs={RESPONSE_TABS_CONFIG}
				context={tabContext}
				value={activeResponseTab}
				onChange={value => dispatch(setActiveResponseTab(value))}
				className='flex-1 flex flex-col min-h-0'
				contentClassName='flex-1 min-h-0'
			/>
		</div>
	);
};

export default ResponseViewer;

