import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Download, ExpandIcon, ShrinkIcon, Copy } from 'lucide-react';
import { MonacoEditor } from '../editor/monaco-editor';

export interface ResponseData {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
	contentType: string;
	size: number;
	duration: number;
	isError: boolean;
	error?: string;
}

export interface ResponseViewerProps {
	response: ResponseData | null;
	isLoading: boolean;
	onDownload?: (format: string) => void;
	onCopy?: (content: string) => void;
	className?: string;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ response, isLoading, onDownload, onCopy, className = '' }) => {
	const [viewMode, setViewMode] = useState<'raw' | 'formatted'>('formatted');
	const [wordWrap, setWordWrap] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);

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
		if (status >= 200 && status < 300) return 'bg-green-500';
		if (status >= 300 && status < 400) return 'bg-yellow-500';
		if (status >= 400 && status < 500) return 'bg-orange-500';
		if (status >= 500) return 'bg-red-500';
		return 'bg-gray-500';
	};

	const handleDownload = () => {
		if (onDownload && response) {
			// Auto-detect format from content type
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
			onDownload(format);
		}
	};

	const handleCopy = () => {
		if (onCopy && response) {
			onCopy(response.body);
		}
	};

	const renderResponseMetrics = () => {
		if (!response) return null;

		return (
			<div className='flex items-center gap-4 p-3 bg-muted/50 rounded-md'>
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
			</div>
		);
	};

	const renderResponseControls = () => {
		return (
			<div className='flex items-center gap-4 p-3 border-b'>
				<div className='flex items-center gap-2'>
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
				</div>
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

	const renderResponseBody = (mode: 'raw' | 'formatted') => {
		if (!response?.body) return null;

		let content = response.body;
		let language = 'plaintext';

		// Detect language from content type
		const contentType = response.contentType || '';
		if (contentType.includes('json')) {
			language = 'json';
		} else if (contentType.includes('xml')) {
			language = 'xml';
		} else if (contentType.includes('html')) {
			language = 'html';
		} else if (contentType.includes('css')) {
			language = 'css';
		} else if (contentType.includes('javascript')) {
			language = 'javascript';
		}

		// RAW MODE: Show exactly what server sent
		if (mode === 'raw') {
			content = response.body; // NO FORMATTING - exact server response
		} else {
			// FORMATTED MODE: Pretty-print the content
			try {
				if (language === 'json') {
					const parsed = JSON.parse(response.body);
					content = JSON.stringify(parsed, null, 2); // Pretty format JSON
				} else if (language === 'xml') {
					// Basic XML formatting - add newlines and indentation
					content = response.body
						.replace(/></g, '>\n<')
						.replace(/^\s*\n/gm, '')
						.split('\n')
						.map((line, index) => {
							const depth = Math.max(0, (line.match(/</g) || []).length - (line.match(/\//g) || []).length);
							return '  '.repeat(Math.max(0, depth - 1)) + line.trim();
						})
						.join('\n');
				} else if (language === 'html') {
					// Basic HTML formatting - add newlines and indentation
					content = response.body
						.replace(/></g, '>\n<')
						.replace(/^\s*\n/gm, '')
						.split('\n')
						.map((line, index) => {
							const depth = Math.max(0, (line.match(/</g) || []).length - (line.match(/\//g) || []).length);
							return '  '.repeat(Math.max(0, depth - 1)) + line.trim();
						})
						.join('\n');
				} else if (language === 'css') {
					// Basic CSS formatting
					content = response.body
						.replace(/;/g, ';\n')
						.replace(/{/g, ' {\n  ')
						.replace(/}/g, '\n}')
						.replace(/,/g, ',\n')
						.split('\n')
						.map(line => line.trim())
						.filter(line => line.length > 0)
						.join('\n');
				} else {
					// For other content types, just use raw content
					content = response.body;
				}
			} catch (error) {
				// If parsing/formatting fails, use raw content
				content = response.body;
			}
		}

		return (
			<div className='relative h-full overflow-hidden border border-border rounded-md'>
				<MonacoEditor value={content} language={language} formatOnMount={false} wordWrap={wordWrap} height='100%' copyButtonVisible={false} />
			</div>
		);
	};

	const renderContent = () => {
		if (isLoading) return renderLoadingState();
		if (!response) return renderEmptyState();
		if (response.isError) return renderErrorState();

		return (
			<div className='h-full flex flex-col'>
				<Tabs value={viewMode} onValueChange={value => setViewMode(value as 'raw' | 'formatted')} className='h-full flex flex-col'>
					<TabsList className='grid w-full grid-cols-2 flex-shrink-0'>
						<TabsTrigger value='formatted'>Formatted</TabsTrigger>
						<TabsTrigger value='raw'>Raw</TabsTrigger>
					</TabsList>

					<TabsContent value='formatted' className='flex-1 mt-2 overflow-hidden'>
						<div className='h-full overflow-hidden'>{renderResponseBody('formatted')}</div>
					</TabsContent>

					<TabsContent value='raw' className='flex-1 mt-2 overflow-hidden'>
						<div className='h-full overflow-hidden'>{renderResponseBody('raw')}</div>
					</TabsContent>
				</Tabs>
			</div>
		);
	};

	return (
		<div className={`flex flex-col h-full ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`} data-testid='response-viewer-container'>
			{/* Response Metrics */}
			{response && !isLoading && renderResponseMetrics()}

			{/* Response Controls */}
			{renderResponseControls()}

			{/* Response Content */}
			<div className='flex-1 overflow-hidden'>{renderContent()}</div>
		</div>
	);
};

export default ResponseViewer;
