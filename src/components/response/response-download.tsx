import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { DownloadIcon, FileIcon, CheckIcon, AlertCircleIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ResponseDownloadProps {
	responseData: {
		body: string;
		headers: Record<string, string>;
		contentType: string;
		status: number;
		url?: string;
	} | null;
	className?: string;
	onDownloadStart?: (format: string, filename: string) => void;
	onDownloadComplete?: (filename: string, success: boolean) => void;
}

interface DownloadFormat {
	value: string;
	label: string;
	extension: string;
	mimeType: string;
	description: string;
}

const DOWNLOAD_FORMATS: DownloadFormat[] = [
	{ value: 'json', label: 'JSON', extension: '.json', mimeType: 'application/json', description: 'JavaScript Object Notation' },
	{ value: 'xml', label: 'XML', extension: '.xml', mimeType: 'application/xml', description: 'Extensible Markup Language' },
	{ value: 'html', label: 'HTML', extension: '.html', mimeType: 'text/html', description: 'HyperText Markup Language' },
	{ value: 'txt', label: 'Text', extension: '.txt', mimeType: 'text/plain', description: 'Plain Text' },
	{ value: 'csv', label: 'CSV', extension: '.csv', mimeType: 'text/csv', description: 'Comma-Separated Values' },
	{ value: 'pdf', label: 'PDF', extension: '.pdf', mimeType: 'application/pdf', description: 'Portable Document Format' },
	{ value: 'raw', label: 'Raw', extension: '.raw', mimeType: 'application/octet-stream', description: 'Raw Binary Data' },
];

export const ResponseDownload: React.FC<ResponseDownloadProps> = ({ responseData, className = '', onDownloadStart, onDownloadComplete }) => {
	const [selectedFormat, setSelectedFormat] = useState('json');
	const [customFilename, setCustomFilename] = useState('');
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);

	// Auto-detect format from content type
	React.useEffect(() => {
		if (responseData?.contentType) {
			const contentType = responseData.contentType.toLowerCase();
			if (contentType.includes('json')) {
				setSelectedFormat('json');
			} else if (contentType.includes('xml')) {
				setSelectedFormat('xml');
			} else if (contentType.includes('html')) {
				setSelectedFormat('html');
			} else if (contentType.includes('csv')) {
				setSelectedFormat('csv');
			} else if (contentType.includes('pdf')) {
				setSelectedFormat('pdf');
			} else {
				setSelectedFormat('txt');
			}
		}
	}, [responseData?.contentType]);

	const generateFilename = (): string => {
		if (customFilename.trim()) {
			const filename = customFilename.trim();
			const selectedExt = DOWNLOAD_FORMATS.find(f => f.value === selectedFormat)?.extension || '.txt';

			// Add extension if not present
			if (!filename.includes('.')) {
				return filename + selectedExt;
			}
			return filename;
		}

		// Generate filename from URL or default
		let baseName = 'response';

		if (responseData?.url) {
			try {
				const url = new URL(responseData.url);
				const pathname = url.pathname;
				const pathParts = pathname.split('/').filter(Boolean);
				if (pathParts.length > 0) {
					baseName = pathParts[pathParts.length - 1].replace(/[^a-zA-Z0-9-_]/g, '_');
				}
			} catch {
				// Use default if URL parsing fails
			}
		}

		const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
		const extension = DOWNLOAD_FORMATS.find(f => f.value === selectedFormat)?.extension || '.txt';

		return `${baseName}_${timestamp}${extension}`;
	};

	const formatContent = (content: string, format: string): string => {
		try {
			switch (format) {
				case 'json': {
					// Try to parse and format JSON
					const parsed = JSON.parse(content);
					return JSON.stringify(parsed, null, 2);
				}
				case 'xml':
				case 'html': {
					// Basic XML/HTML formatting
					return formatXml(content);
				}
				case 'csv': {
					// Convert JSON to CSV if possible
					return convertJsonToCsv(content);
				}
				default:
					return content;
			}
		} catch (error) {
			console.warn(`Failed to format content as ${format}:`, error);
			return content;
		}
	};

	const formatXml = (xml: string): string => {
		// Basic XML formatting
		let formatted = '';
		let indent = 0;
		const tab = '  ';

		xml.split('<').forEach((node, index) => {
			if (index === 0) {
				formatted += node;
				return;
			}

			if (node.startsWith('/')) {
				indent--;
			}

			formatted += '\n' + tab.repeat(Math.max(0, indent)) + '<' + node;

			if (!node.startsWith('/') && !node.endsWith('/>') && node.includes('>')) {
				indent++;
			}
		});

		return formatted;
	};

	const convertJsonToCsv = (jsonContent: string): string => {
		try {
			const data = JSON.parse(jsonContent);

			if (Array.isArray(data) && data.length > 0) {
				const headers = Object.keys(data[0]);
				const csvHeaders = headers.join(',');
				const csvRows = data.map(row =>
					headers
						.map(header => {
							const value = row[header];
							// Escape commas and quotes
							if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
								return `"${value.replace(/"/g, '""')}"`;
							}
							return value;
						})
						.join(',')
				);

				return [csvHeaders, ...csvRows].join('\n');
			}

			// Fallback for non-array data
			return JSON.stringify(data);
		} catch {
			return jsonContent;
		}
	};

	const downloadFile = async () => {
		if (!responseData?.body) return;

		setIsDownloading(true);
		setDownloadProgress(0);
		setDownloadError(null);

		try {
			const filename = generateFilename();
			const format = DOWNLOAD_FORMATS.find(f => f.value === selectedFormat);

			onDownloadStart?.(selectedFormat, filename);

			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				setDownloadProgress(prev => Math.min(prev + 10, 90));
			}, 100);

			// Format content based on selected format
			const formattedContent = formatContent(responseData.body, selectedFormat);

			// Create blob and download
			const blob = new Blob([formattedContent], {
				type: format?.mimeType || 'text/plain',
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			clearInterval(progressInterval);
			setDownloadProgress(100);

			// Complete download
			setTimeout(() => {
				setIsDownloading(false);
				setDownloadProgress(0);
				setIsDialogOpen(false);
				onDownloadComplete?.(filename, true);
			}, 500);
		} catch (error) {
			setDownloadError(error instanceof Error ? error.message : 'Download failed');
			setIsDownloading(false);
			setDownloadProgress(0);
			onDownloadComplete?.(generateFilename(), false);
		}
	};

	const getFileSizeEstimate = (): string => {
		if (!responseData?.body) return '0 KB';

		const sizeInBytes = new Blob([responseData.body]).size;
		const sizeInKB = sizeInBytes / 1024;

		if (sizeInKB < 1) {
			return `${sizeInBytes} B`;
		} else if (sizeInKB < 1024) {
			return `${sizeInKB.toFixed(1)} KB`;
		} else {
			return `${(sizeInKB / 1024).toFixed(1)} MB`;
		}
	};

	const selectedFormatInfo = DOWNLOAD_FORMATS.find(f => f.value === selectedFormat);

	return (
		<div className={cn('flex items-center gap-2', className)}>
			{/* Quick Download Button */}
			<Button variant='outline' size='sm' onClick={downloadFile} disabled={!responseData?.body || isDownloading} className='gap-2'>
				<DownloadIcon className='w-4 h-4' />
				Download
			</Button>

			{/* Advanced Download Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogTrigger asChild>
					<Button variant='outline' size='sm' disabled={!responseData?.body}>
						Options
					</Button>
				</DialogTrigger>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<FileIcon className='w-5 h-5' />
							Download Response
						</DialogTitle>
					</DialogHeader>

					<div className='space-y-4'>
						{/* Format Selection */}
						<div className='space-y-2'>
							<Label htmlFor='format'>Format</Label>
							<Select value={selectedFormat} onValueChange={setSelectedFormat}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{DOWNLOAD_FORMATS.map(format => (
										<SelectItem key={format.value} value={format.value}>
											<div className='flex items-center gap-2'>
												<Badge variant='outline' className='text-xs'>
													{format.extension}
												</Badge>
												<span>{format.label}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selectedFormatInfo && <p className='text-xs text-muted-foreground'>{selectedFormatInfo.description}</p>}
						</div>

						{/* Custom Filename */}
						<div className='space-y-2'>
							<Label htmlFor='filename'>Filename (optional)</Label>
							<Input id='filename' value={customFilename} onChange={e => setCustomFilename(e.target.value)} placeholder='Leave empty for auto-generated name' />
							<p className='text-xs text-muted-foreground'>
								Generated: <code>{generateFilename()}</code>
							</p>
						</div>

						{/* File Info */}
						<div className='flex items-center justify-between text-sm'>
							<span className='text-muted-foreground'>Estimated size:</span>
							<Badge variant='secondary'>{getFileSizeEstimate()}</Badge>
						</div>

						{/* Download Progress */}
						{isDownloading && (
							<div className='space-y-2'>
								<div className='flex items-center justify-between text-sm'>
									<span>Downloading...</span>
									<span>{downloadProgress}%</span>
								</div>
								<Progress value={downloadProgress} className='h-2' />
							</div>
						)}

						{/* Error Message */}
						{downloadError && (
							<div className='flex items-center gap-2 text-sm text-red-600'>
								<AlertCircleIcon className='w-4 h-4' />
								{downloadError}
							</div>
						)}

						{/* Action Buttons */}
						<div className='flex justify-end gap-2'>
							<Button variant='outline' onClick={() => setIsDialogOpen(false)} disabled={isDownloading}>
								Cancel
							</Button>
							<Button onClick={downloadFile} disabled={!responseData?.body || isDownloading} className='gap-2'>
								{isDownloading ? <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' /> : <CheckIcon className='w-4 h-4' />}
								Download
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ResponseDownload;
