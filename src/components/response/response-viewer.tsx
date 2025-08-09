import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Download, ExpandIcon, ShrinkIcon, Copy } from 'lucide-react';

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

interface ResponseFormat {
	name: string;
	value: string;
	language: string;
}

const RESPONSE_FORMATS: ResponseFormat[] = [
	{ name: 'JSON', value: 'json', language: 'json' },
	{ name: 'XML', value: 'xml', language: 'xml' },
	{ name: 'HTML', value: 'html', language: 'html' },
	{ name: 'Text', value: 'text', language: 'plaintext' },
	{ name: 'JavaScript', value: 'javascript', language: 'javascript' },
	{ name: 'CSS', value: 'css', language: 'css' },
];

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ response, isLoading, onDownload, onCopy, className = '' }) => {
	const [selectedFormat, setSelectedFormat] = useState('json');
	const [viewMode, setViewMode] = useState<'raw' | 'formatted'>('formatted');
	const [wordWrap, setWordWrap] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);

	// Auto-detect content type from response
	useEffect(() => {
		if (response?.contentType) {
			const contentType = response.contentType.toLowerCase();
			if (contentType.includes('json')) {
				setSelectedFormat('json');
			} else if (contentType.includes('xml')) {
				setSelectedFormat('xml');
			} else if (contentType.includes('html')) {
				setSelectedFormat('html');
			} else if (contentType.includes('javascript')) {
				setSelectedFormat('javascript');
			} else if (contentType.includes('css')) {
				setSelectedFormat('css');
			} else {
				setSelectedFormat('text');
			}
		}
	}, [response?.contentType]);

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
			onDownload(selectedFormat);
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
				<Select value={selectedFormat} onValueChange={setSelectedFormat}>
					<SelectTrigger className='w-32'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{RESPONSE_FORMATS.map(format => (
							<SelectItem key={format.value} value={format.value}>
								{format.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className='flex items-center gap-2'>
					<Switch id='word-wrap' checked={wordWrap} onCheckedChange={setWordWrap} />
					<Label htmlFor='word-wrap' className='text-sm'>
						Word Wrap
					</Label>
				</div>

				<div className='flex items-center gap-2 ml-auto'>
					<Button variant='outline' size='sm' onClick={handleCopy} disabled={!response?.body}>
						<Copy className='w-4 h-4 mr-2' />
						Copy
					</Button>
					<Button variant='outline' size='sm' onClick={handleDownload} disabled={!response?.body}>
						<Download className='w-4 h-4 mr-2' />
						Download
					</Button>
					<Button variant='outline' size='sm' onClick={() => setIsFullscreen(!isFullscreen)}>
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
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
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

	const renderResponseBody = () => {
		if (!response?.body) return null;

		// This will be enhanced with Monaco Editor integration
		return (
			<div className='relative h-full'>
				<pre
					className={`
            text-sm p-4 h-full overflow-auto font-mono
            ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}
          `}>
					{response.body}
				</pre>
			</div>
		);
	};

	const renderContent = () => {
		if (isLoading) return renderLoadingState();
		if (!response) return renderEmptyState();
		if (response.isError) return renderErrorState();

		return (
			<Tabs value={viewMode} onValueChange={value => setViewMode(value as 'raw' | 'formatted')}>
				<TabsList className='grid w-full grid-cols-2'>
					<TabsTrigger value='formatted'>Formatted</TabsTrigger>
					<TabsTrigger value='raw'>Raw</TabsTrigger>
				</TabsList>

				<TabsContent value='formatted' className='h-full mt-0'>
					<div className='h-full border rounded-md'>{renderResponseBody()}</div>
				</TabsContent>

				<TabsContent value='raw' className='h-full mt-0'>
					<div className='h-full border rounded-md'>{renderResponseBody()}</div>
				</TabsContent>
			</Tabs>
		);
	};

	return (
		<div className={`flex flex-col h-full ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
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
