import React, { useState, useMemo } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SearchIcon, CopyIcon, InfoIcon, ClockIcon, ShieldIcon, GlobeIcon, CheckIcon, AlertTriangleIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ResponseHeadersProps {
	headers: Record<string, string>;
	responseTime?: number;
	responseSize?: number;
	className?: string;
	onHeaderCopy?: (key: string, value: string) => void;
}

interface HeaderInfo {
	category: 'security' | 'cache' | 'content' | 'cors' | 'general';
	description: string;
	importance: 'high' | 'medium' | 'low';
	learnMoreUrl?: string;
}

// Header information database
const HEADER_INFO: Record<string, HeaderInfo> = {
	'content-type': {
		category: 'content',
		description: 'Specifies the media type of the response body',
		importance: 'high',
		learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type',
	},
	'content-length': {
		category: 'content',
		description: 'The size of the response body in bytes',
		importance: 'medium',
	},
	'content-encoding': {
		category: 'content',
		description: 'Compression encoding applied to the response',
		importance: 'medium',
	},
	'cache-control': {
		category: 'cache',
		description: 'Directives for caching mechanisms',
		importance: 'high',
	},
	expires: {
		category: 'cache',
		description: 'Date/time when the response is considered stale',
		importance: 'medium',
	},
	etag: {
		category: 'cache',
		description: 'Identifier for a specific version of a resource',
		importance: 'medium',
	},
	'last-modified': {
		category: 'cache',
		description: 'Date and time the resource was last modified',
		importance: 'medium',
	},
	'set-cookie': {
		category: 'security',
		description: 'Sends cookies from the server to the client',
		importance: 'high',
	},
	'x-frame-options': {
		category: 'security',
		description: 'Controls whether the page can be embedded in frames',
		importance: 'high',
	},
	'x-content-type-options': {
		category: 'security',
		description: 'Prevents MIME type sniffing',
		importance: 'high',
	},
	'x-xss-protection': {
		category: 'security',
		description: 'Enables XSS filtering in browsers',
		importance: 'high',
	},
	'strict-transport-security': {
		category: 'security',
		description: 'Forces secure HTTPS connections',
		importance: 'high',
	},
	'content-security-policy': {
		category: 'security',
		description: 'Controls resource loading to prevent XSS',
		importance: 'high',
	},
	'access-control-allow-origin': {
		category: 'cors',
		description: 'Specifies which origins can access the resource',
		importance: 'high',
	},
	'access-control-allow-methods': {
		category: 'cors',
		description: 'Specifies allowed HTTP methods for CORS',
		importance: 'medium',
	},
	'access-control-allow-headers': {
		category: 'cors',
		description: 'Specifies allowed headers for CORS requests',
		importance: 'medium',
	},
	server: {
		category: 'general',
		description: 'Information about the server software',
		importance: 'low',
	},
	date: {
		category: 'general',
		description: 'Date and time the response was sent',
		importance: 'low',
	},
	location: {
		category: 'general',
		description: 'URL to redirect to or location of created resource',
		importance: 'high',
	},
};

export const ResponseHeaders: React.FC<ResponseHeadersProps> = ({ headers, responseTime, responseSize, className = '', onHeaderCopy }) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [copiedHeader, setCopiedHeader] = useState<string | null>(null);

	// Filter headers based on search term
	const filteredHeaders = useMemo(() => {
		if (!searchTerm) return Object.entries(headers);

		const term = searchTerm.toLowerCase();
		return Object.entries(headers).filter(([key, value]) => key.toLowerCase().includes(term) || value.toLowerCase().includes(term));
	}, [headers, searchTerm]);

	// Group headers by category
	const categorizedHeaders = useMemo(() => {
		const categories = {
			security: [] as Array<[string, string]>,
			cache: [] as Array<[string, string]>,
			content: [] as Array<[string, string]>,
			cors: [] as Array<[string, string]>,
			general: [] as Array<[string, string]>,
		};

		filteredHeaders.forEach(([key, value]) => {
			const headerInfo = HEADER_INFO[key.toLowerCase()];
			const category = headerInfo?.category || 'general';
			categories[category].push([key, value]);
		});

		return categories;
	}, [filteredHeaders]);

	// Security analysis
	const securityAnalysis = useMemo(() => {
		const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection', 'strict-transport-security', 'content-security-policy'];

		const present = securityHeaders.filter(header => Object.keys(headers).some(key => key.toLowerCase() === header));

		const missing = securityHeaders.filter(header => !Object.keys(headers).some(key => key.toLowerCase() === header));

		return { present, missing, score: (present.length / securityHeaders.length) * 100 };
	}, [headers]);

	const handleCopyHeader = async (key: string, value: string) => {
		try {
			await navigator.clipboard.writeText(`${key}: ${value}`);
			setCopiedHeader(key);
			setTimeout(() => setCopiedHeader(null), 2000);
			onHeaderCopy?.(key, value);
		} catch (error) {
			console.error('Failed to copy header:', error);
		}
	};

	const handleCopyValue = async (value: string) => {
		try {
			await navigator.clipboard.writeText(value);
		} catch (error) {
			console.error('Failed to copy value:', error);
		}
	};

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case 'security':
				return ShieldIcon;
			case 'cache':
				return ClockIcon;
			case 'content':
				return InfoIcon;
			case 'cors':
				return GlobeIcon;
			default:
				return InfoIcon;
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case 'security':
				return 'text-red-600 dark:text-red-400';
			case 'cache':
				return 'text-blue-600 dark:text-blue-400';
			case 'content':
				return 'text-green-600 dark:text-green-400';
			case 'cors':
				return 'text-purple-600 dark:text-purple-400';
			default:
				return 'text-gray-600 dark:text-gray-400';
		}
	};

	const renderHeaderRow = (key: string, value: string) => {
		const headerInfo = HEADER_INFO[key.toLowerCase()];
		const CategoryIcon = getCategoryIcon(headerInfo?.category || 'general');

		return (
			<div key={key} className='flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 group'>
				<CategoryIcon className={cn('w-4 h-4 mt-1 flex-shrink-0', getCategoryColor(headerInfo?.category || 'general'))} />

				<div className='flex-1 min-w-0'>
					<div className='flex items-center gap-2 mb-1'>
						<code className='text-sm font-medium text-blue-600 dark:text-blue-400'>{key}</code>
						{headerInfo && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<InfoIcon className='w-3 h-3 text-muted-foreground cursor-help' />
									</TooltipTrigger>
									<TooltipContent side='top' className='max-w-xs'>
										<p>{headerInfo.description}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
						{headerInfo?.importance === 'high' && (
							<Badge variant='destructive' className='text-xs'>
								Important
							</Badge>
						)}
					</div>

					<div className='text-sm text-muted-foreground break-all'>{value}</div>
				</div>

				<div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant='ghost' size='sm' className='h-6 w-6 p-0' onClick={() => handleCopyValue(value)}>
									{copiedHeader === key ? <CheckIcon className='w-3 h-3 text-green-500' /> : <CopyIcon className='w-3 h-3' />}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Copy value</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant='ghost' size='sm' className='h-6 w-6 p-0' onClick={() => handleCopyHeader(key, value)}>
									<CopyIcon className='w-3 h-3' />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Copy header</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		);
	};

	const renderCategorySection = (category: string, headerList: Array<[string, string]>) => {
		if (headerList.length === 0) return null;

		const CategoryIcon = getCategoryIcon(category);
		const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);

		return (
			<div key={category} className='space-y-2'>
				<div className='flex items-center gap-2'>
					<CategoryIcon className={cn('w-4 h-4', getCategoryColor(category))} />
					<h3 className='text-sm font-medium'>{categoryTitle} Headers</h3>
					<Badge variant='outline' className='text-xs'>
						{headerList.length}
					</Badge>
				</div>
				<div className='space-y-1'>{headerList.map(([key, value]) => renderHeaderRow(key, value))}</div>
			</div>
		);
	};

	const renderSecurityAnalysis = () => (
		<div className='space-y-4'>
			<div className='flex items-center gap-2'>
				<ShieldIcon className='w-5 h-5 text-red-600 dark:text-red-400' />
				<h3 className='text-lg font-medium'>Security Analysis</h3>
			</div>

			<div className='grid gap-4'>
				{/* Security Score */}
				<div className='p-4 rounded-lg border'>
					<div className='flex items-center justify-between mb-2'>
						<span className='text-sm font-medium'>Security Score</span>
						<Badge variant={securityAnalysis.score >= 80 ? 'default' : securityAnalysis.score >= 50 ? 'secondary' : 'destructive'}>
							{Math.round(securityAnalysis.score)}%
						</Badge>
					</div>
					<div className='text-xs text-muted-foreground'>{securityAnalysis.present.length} of 5 important security headers present</div>
				</div>

				{/* Present Headers */}
				{securityAnalysis.present.length > 0 && (
					<div className='space-y-2'>
						<h4 className='text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2'>
							<CheckIcon className='w-4 h-4' />
							Present Security Headers
						</h4>
						<div className='space-y-1'>
							{securityAnalysis.present.map(header => {
								const value = headers[Object.keys(headers).find(k => k.toLowerCase() === header) || ''];
								return (
									<div key={header} className='text-sm'>
										<code className='text-green-600 dark:text-green-400'>{header}</code>
										<span className='text-muted-foreground ml-2'>{value}</span>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Missing Headers */}
				{securityAnalysis.missing.length > 0 && (
					<div className='space-y-2'>
						<h4 className='text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2'>
							<AlertTriangleIcon className='w-4 h-4' />
							Missing Security Headers
						</h4>
						<div className='space-y-1'>
							{securityAnalysis.missing.map(header => (
								<div key={header} className='text-sm'>
									<code className='text-orange-600 dark:text-orange-400'>{header}</code>
									<span className='text-muted-foreground ml-2'>Not present</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div className={cn('flex flex-col h-full', className)}>
			{/* Header Summary */}
			<div className='p-4 border-b'>
				<div className='flex items-center justify-between mb-3'>
					<h2 className='text-lg font-semibold'>Response Headers</h2>
					<Badge variant='outline'>{Object.keys(headers).length} headers</Badge>
				</div>

				{/* Meta Information */}
				<div className='flex items-center gap-4 text-sm text-muted-foreground'>
					{responseTime && (
						<div className='flex items-center gap-1'>
							<ClockIcon className='w-4 h-4' />
							{responseTime}ms
						</div>
					)}
					{responseSize && (
						<div className='flex items-center gap-1'>
							<InfoIcon className='w-4 h-4' />
							{responseSize} bytes
						</div>
					)}
				</div>
			</div>

			{/* Search */}
			<div className='p-4 border-b'>
				<div className='relative'>
					<SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
					<Input placeholder='Search headers...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='pl-10' />
				</div>
			</div>

			{/* Content */}
			<Tabs defaultValue='grouped' className='flex-1 flex flex-col'>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='grouped'>Grouped</TabsTrigger>
					<TabsTrigger value='all'>All Headers</TabsTrigger>
					<TabsTrigger value='security'>Security</TabsTrigger>
				</TabsList>

				{/* Grouped View */}
				<TabsContent value='grouped' className='flex-1'>
					<ScrollArea className='h-full'>
						<div className='p-4 space-y-6'>
							{Object.entries(categorizedHeaders).map(([category, headerList]) => renderCategorySection(category, headerList))}
						</div>
					</ScrollArea>
				</TabsContent>

				{/* All Headers View */}
				<TabsContent value='all' className='flex-1'>
					<ScrollArea className='h-full'>
						<div className='p-4 space-y-2'>{filteredHeaders.map(([key, value]) => renderHeaderRow(key, value))}</div>
					</ScrollArea>
				</TabsContent>

				{/* Security Analysis */}
				<TabsContent value='security' className='flex-1'>
					<ScrollArea className='h-full'>
						<div className='p-4'>{renderSecurityAnalysis()}</div>
					</ScrollArea>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default ResponseHeaders;
