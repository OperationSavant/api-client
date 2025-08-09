import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { MonitorIcon, SmartphoneIcon, TabletIcon, DownloadIcon, PrinterIcon, RefreshCwIcon, AlertTriangleIcon, ExternalLinkIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface HtmlPreviewPanelProps {
	htmlContent: string;
	title?: string;
	baseUrl?: string;
	allowScripts?: boolean;
	allowForms?: boolean;
	className?: string;
	onError?: (error: string) => void;
	onLoad?: () => void;
}

interface ViewportSize {
	name: string;
	width: number;
	height: number;
	icon: React.ComponentType<{ className?: string }>;
}

const VIEWPORT_SIZES: ViewportSize[] = [
	{ name: 'Desktop', width: 1200, height: 800, icon: MonitorIcon },
	{ name: 'Tablet', width: 768, height: 1024, icon: TabletIcon },
	{ name: 'Mobile', width: 375, height: 667, icon: SmartphoneIcon },
];

export const HtmlPreviewPanel: React.FC<HtmlPreviewPanelProps> = ({
	htmlContent,
	title = 'HTML Preview',
	baseUrl,
	allowScripts = false,
	allowForms = false,
	className = '',
	onError,
	onLoad,
}) => {
	const [selectedViewport, setSelectedViewport] = useState(VIEWPORT_SIZES[0]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isResponsive, setIsResponsive] = useState(false);
	const [scale, setScale] = useState(1);
	const [showDeviceFrame, setShowDeviceFrame] = useState(true);

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Calculate scale to fit viewport in container
	useEffect(() => {
		if (containerRef.current && !isResponsive) {
			const container = containerRef.current;
			const containerWidth = container.clientWidth - 40; // Account for padding
			const containerHeight = container.clientHeight - 100; // Account for controls

			const scaleX = containerWidth / selectedViewport.width;
			const scaleY = containerHeight / selectedViewport.height;
			const newScale = Math.min(scaleX, scaleY, 1);

			setScale(newScale);
		} else {
			setScale(1);
		}
	}, [selectedViewport, isResponsive]);

	// Clean and sanitize HTML content
	const sanitizeHtml = (html: string): string => {
		let sanitized = html;

		// Remove dangerous elements if scripts not allowed
		if (!allowScripts) {
			sanitized = sanitized
				.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
				.replace(/<script[^>]*\/>/gi, '')
				.replace(/on\w+="[^"]*"/gi, '') // Remove inline event handlers
				.replace(/on\w+='[^']*'/gi, '') // Remove inline event handlers
				.replace(/javascript:/gi, ''); // Remove javascript: protocols
		}

		// Remove forms if not allowed
		if (!allowForms) {
			sanitized = sanitized
				.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
				.replace(/<input[^>]*>/gi, '')
				.replace(/<textarea[^>]*>[\s\S]*?<\/textarea>/gi, '')
				.replace(/<select[^>]*>[\s\S]*?<\/select>/gi, '');
		}

		// Add base tag if baseUrl provided
		if (baseUrl && !sanitized.includes('<base')) {
			const baseTag = `<base href="${baseUrl}">`;
			if (sanitized.includes('<head>')) {
				sanitized = sanitized.replace('<head>', `<head>${baseTag}`);
			} else {
				sanitized = `${baseTag}${sanitized}`;
			}
		}

		// Add responsive meta tag if needed
		if (isResponsive && !sanitized.includes('viewport')) {
			const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
			if (sanitized.includes('<head>')) {
				sanitized = sanitized.replace('<head>', `<head>${viewportTag}`);
			} else {
				sanitized = `<head>${viewportTag}</head>${sanitized}`;
			}
		}

		return sanitized;
	};

	// Handle iframe load
	const handleIframeLoad = () => {
		setIsLoading(false);
		setError(null);
		onLoad?.();

		// Add error listener to iframe content
		const iframe = iframeRef.current;
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.addEventListener('error', event => {
				const errorMessage = `Error in HTML content: ${event.error?.message || 'Unknown error'}`;
				setError(errorMessage);
				onError?.(errorMessage);
			});
		}
	};

	// Handle iframe error
	const handleIframeError = () => {
		const errorMessage = 'Failed to load HTML content';
		setIsLoading(false);
		setError(errorMessage);
		onError?.(errorMessage);
	};

	// Refresh preview
	const handleRefresh = () => {
		setIsLoading(true);
		setError(null);

		if (iframeRef.current) {
			// Force reload by setting src to empty then back to content
			iframeRef.current.src = 'about:blank';
			setTimeout(() => {
				updateIframeContent();
			}, 100);
		}
	};

	// Update iframe content
	const updateIframeContent = () => {
		if (iframeRef.current) {
			const sanitizedHtml = sanitizeHtml(htmlContent);
			const blob = new Blob([sanitizedHtml], { type: 'text/html' });
			const url = URL.createObjectURL(blob);
			iframeRef.current.src = url;

			// Clean up the blob URL after a delay
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		}
	};

	// Update content when htmlContent changes
	useEffect(() => {
		if (htmlContent) {
			setIsLoading(true);
			updateIframeContent();
		}
	}, [htmlContent, allowScripts, allowForms, baseUrl, isResponsive]);

	// Download HTML
	const handleDownload = () => {
		const sanitizedHtml = sanitizeHtml(htmlContent);
		const blob = new Blob([sanitizedHtml], { type: 'text/html' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'preview.html';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	// Print HTML
	const handlePrint = () => {
		if (iframeRef.current?.contentWindow) {
			iframeRef.current.contentWindow.print();
		}
	};

	// Open in new window
	const handleOpenInNewWindow = () => {
		const sanitizedHtml = sanitizeHtml(htmlContent);
		const newWindow = window.open('', '_blank');
		if (newWindow) {
			newWindow.document.write(sanitizedHtml);
			newWindow.document.close();
		}
	};

	const getSandboxAttributes = (): string => {
		const sandbox = ['allow-same-origin'];

		if (allowScripts) {
			sandbox.push('allow-scripts');
		}

		if (allowForms) {
			sandbox.push('allow-forms');
		}

		return sandbox.join(' ');
	};

	const renderControls = () => (
		<div className='flex items-center gap-4 p-3 border-b bg-muted/30'>
			{/* Viewport Selector */}
			<div className='flex items-center gap-2'>
				<Label className='text-sm font-medium'>Viewport:</Label>
				<Select
					value={selectedViewport.name}
					onValueChange={value => {
						const viewport = VIEWPORT_SIZES.find(v => v.name === value);
						if (viewport) setSelectedViewport(viewport);
					}}>
					<SelectTrigger className='w-32'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{VIEWPORT_SIZES.map(viewport => (
							<SelectItem key={viewport.name} value={viewport.name}>
								<div className='flex items-center gap-2'>
									<viewport.icon className='w-4 h-4' />
									{viewport.name}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Separator orientation='vertical' className='h-4' />

			{/* Responsive Toggle */}
			<div className='flex items-center gap-2'>
				<Switch id='responsive' checked={isResponsive} onCheckedChange={setIsResponsive} />
				<Label htmlFor='responsive' className='text-sm'>
					Responsive
				</Label>
			</div>

			{/* Device Frame Toggle */}
			<div className='flex items-center gap-2'>
				<Switch id='device-frame' checked={showDeviceFrame} onCheckedChange={setShowDeviceFrame} />
				<Label htmlFor='device-frame' className='text-sm'>
					Device Frame
				</Label>
			</div>

			<Separator orientation='vertical' className='h-4' />

			{/* Security Badges */}
			<div className='flex items-center gap-2'>
				<Badge variant={allowScripts ? 'destructive' : 'secondary'} className='text-xs'>
					Scripts {allowScripts ? 'ON' : 'OFF'}
				</Badge>
				<Badge variant={allowForms ? 'default' : 'secondary'} className='text-xs'>
					Forms {allowForms ? 'ON' : 'OFF'}
				</Badge>
			</div>

			{/* Actions */}
			<div className='flex items-center gap-2 ml-auto'>
				<Button variant='outline' size='sm' onClick={handleRefresh}>
					<RefreshCwIcon className='w-4 h-4' />
				</Button>
				<Button variant='outline' size='sm' onClick={handleDownload}>
					<DownloadIcon className='w-4 h-4' />
				</Button>
				<Button variant='outline' size='sm' onClick={handlePrint}>
					<PrinterIcon className='w-4 h-4' />
				</Button>
				<Button variant='outline' size='sm' onClick={handleOpenInNewWindow}>
					<ExternalLinkIcon className='w-4 h-4' />
				</Button>
			</div>
		</div>
	);

	const renderError = () => (
		<div className='flex items-center justify-center h-full'>
			<div className='flex flex-col items-center gap-4 text-center max-w-md'>
				<AlertTriangleIcon className='w-12 h-12 text-orange-500' />
				<div>
					<h3 className='text-lg font-semibold text-red-600 mb-2'>Preview Error</h3>
					<p className='text-sm text-muted-foreground'>{error}</p>
				</div>
				<Button onClick={handleRefresh} variant='outline'>
					<RefreshCwIcon className='w-4 h-4 mr-2' />
					Try Again
				</Button>
			</div>
		</div>
	);

	const renderLoading = () => (
		<div className='flex items-center justify-center h-full'>
			<div className='flex flex-col items-center gap-4'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
				<p className='text-sm text-muted-foreground'>Loading preview...</p>
			</div>
		</div>
	);

	const renderPreview = () => {
		if (!htmlContent) {
			return (
				<div className='flex items-center justify-center h-full'>
					<p className='text-sm text-muted-foreground'>No HTML content to preview</p>
				</div>
			);
		}

		const iframeStyle: React.CSSProperties = isResponsive
			? {
					width: '100%',
					height: '100%',
					border: 'none',
			}
			: {
					width: selectedViewport.width,
					height: selectedViewport.height,
					border: showDeviceFrame ? '8px solid #333' : 'none',
					borderRadius: showDeviceFrame ? '12px' : '0',
					transform: `scale(${scale})`,
					transformOrigin: 'top left',
			};

		return (
			<div className={cn('flex items-center justify-center h-full overflow-auto', isResponsive ? 'p-0' : 'p-4')} ref={containerRef}>
				<iframe
					ref={iframeRef}
					title={title}
					sandbox={getSandboxAttributes()}
					style={iframeStyle}
					onLoad={handleIframeLoad}
					onError={handleIframeError}
					className={cn('bg-white', showDeviceFrame && !isResponsive && 'shadow-xl')}
				/>
			</div>
		);
	};

	return (
		<div className={cn('flex flex-col h-full', className)}>
			{renderControls()}

			<div className='flex-1 relative'>{error ? renderError() : isLoading ? renderLoading() : renderPreview()}</div>
		</div>
	);
};

export default HtmlPreviewPanel;
