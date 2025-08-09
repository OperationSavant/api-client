/**
 * Cookie Manager Component
 * Main component for managing cookies with viewing, editing, and operations
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
	CookieIcon,
	SearchIcon,
	PlusIcon,
	TrashIcon,
	DownloadIcon,
	UploadIcon,
	CopyIcon,
	EditIcon,
	FilterIcon,
	ShieldIcon,
	ClockIcon,
	GlobeIcon,
	InfoIcon,
	CheckIcon,
	AlertTriangleIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Cookie, CookieFilter, CookieStats, CookieManagerProps } from '../../types/cookie';

export const CookieManager: React.FC<CookieManagerProps> = ({
	cookies,
	onAddCookie,
	onUpdateCookie,
	onDeleteCookie,
	onDeleteAll,
	onImport,
	onExport,
	className = '',
}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [filter, setFilter] = useState<CookieFilter>({});
	const [selectedDomain, setSelectedDomain] = useState<string>('all');
	const [showExpired, setShowExpired] = useState(false);
	const [showSecureOnly, setShowSecureOnly] = useState(false);
	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

	// Calculate statistics
	const stats: CookieStats = useMemo(() => {
		const domains = new Set(cookies.map(c => c.domain));
		const now = new Date();

		return {
			total: cookies.length,
			session: cookies.filter(c => c.session).length,
			persistent: cookies.filter(c => !c.session).length,
			secure: cookies.filter(c => c.secure).length,
			httpOnly: cookies.filter(c => c.httpOnly).length,
			sameSiteStrict: cookies.filter(c => c.sameSite === 'Strict').length,
			sameSiteLax: cookies.filter(c => c.sameSite === 'Lax').length,
			sameSiteNone: cookies.filter(c => c.sameSite === 'None').length,
			expired: cookies.filter(c => c.expires && c.expires < now).length,
			domains: domains.size,
		};
	}, [cookies]);

	// Get unique domains for filtering
	const domains = useMemo(() => {
		const domainSet = new Set(cookies.map(cookie => cookie.domain));
		return Array.from(domainSet).sort();
	}, [cookies]);

	// Filter cookies based on search and filters
	const filteredCookies = useMemo(() => {
		return cookies.filter(cookie => {
			// Search filter
			if (searchTerm) {
				const search = searchTerm.toLowerCase();
				const matchesSearch =
					cookie.name.toLowerCase().includes(search) || cookie.value.toLowerCase().includes(search) || cookie.domain.toLowerCase().includes(search);
				if (!matchesSearch) return false;
			}

			// Domain filter
			if (selectedDomain !== 'all' && cookie.domain !== selectedDomain) {
				return false;
			}

			// Show expired filter
			if (!showExpired && cookie.expires && cookie.expires < new Date()) {
				return false;
			}

			// Secure only filter
			if (showSecureOnly && !cookie.secure) {
				return false;
			}

			return true;
		});
	}, [cookies, searchTerm, selectedDomain, showExpired, showSecureOnly]);

	const handleCopyCookie = async (cookie: Cookie): Promise<void> => {
		try {
			const cookieString = `${cookie.name}=${cookie.value}`;
			await navigator.clipboard.writeText(cookieString);
		} catch (error) {
			console.error('Failed to copy cookie:', error);
		}
	};

	const handleDeleteDomain = (domain: string): void => {
		// Delete all cookies for a specific domain
		cookies
			.filter(cookie => cookie.domain === domain)
			.forEach(cookie => {
				onDeleteCookie(`${cookie.domain}:${cookie.path}:${cookie.name}`);
			});
	};

	const renderCookieRow = (cookie: Cookie) => {
		const isExpired = cookie.expires && cookie.expires < new Date();
		const isSession = cookie.session;

		return (
			<div
				key={`${cookie.domain}:${cookie.path}:${cookie.name}`}
				className={cn('flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 group', isExpired && 'opacity-60')}>
				{/* Cookie Icon & Type */}
				<div className='flex items-center gap-2'>
					<CookieIcon className={cn('w-4 h-4', cookie.secure ? 'text-green-600' : 'text-gray-400')} />
					{cookie.httpOnly && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<ShieldIcon className='w-3 h-3 text-blue-500' />
								</TooltipTrigger>
								<TooltipContent>HttpOnly</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					{isSession && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<ClockIcon className='w-3 h-3 text-orange-500' />
								</TooltipTrigger>
								<TooltipContent>Session Cookie</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>

				{/* Cookie Details */}
				<div className='flex-1 min-w-0'>
					<div className='flex items-center gap-2 mb-1'>
						<code className='text-sm font-medium text-blue-600 dark:text-blue-400'>{cookie.name}</code>
						<Badge variant='outline' className='text-xs'>
							{cookie.domain}
						</Badge>
						{cookie.sameSite && (
							<Badge variant='secondary' className='text-xs'>
								{cookie.sameSite}
							</Badge>
						)}
					</div>
					<div className='text-sm text-muted-foreground truncate'>{cookie.value.length > 50 ? `${cookie.value.substring(0, 50)}...` : cookie.value}</div>
					{cookie.expires && <div className='text-xs text-muted-foreground mt-1'>Expires: {cookie.expires.toLocaleString()}</div>}
				</div>

				{/* Actions */}
				<div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant='ghost' size='sm' className='h-6 w-6 p-0' onClick={() => handleCopyCookie(cookie)}>
									<CopyIcon className='w-3 h-3' />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Copy Cookie</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant='ghost' size='sm' className='h-6 w-6 p-0' onClick={() => console.log('Edit cookie:', cookie)}>
									<EditIcon className='w-3 h-3' />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Edit Cookie</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant='ghost'
									size='sm'
									className='h-6 w-6 p-0 text-red-500 hover:text-red-700'
									onClick={() => onDeleteCookie(`${cookie.domain}:${cookie.path}:${cookie.name}`)}>
									<TrashIcon className='w-3 h-3' />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Delete Cookie</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		);
	};

	const renderStatsCard = (label: string, value: number, icon: React.ElementType, color: string) => {
		const Icon = icon;
		return (
			<div className='p-3 rounded-lg border bg-card'>
				<div className='flex items-center gap-2 mb-1'>
					<Icon className={cn('w-4 h-4', color)} />
					<span className='text-sm font-medium'>{label}</span>
				</div>
				<div className='text-lg font-bold'>{value}</div>
			</div>
		);
	};

	const renderDomainSection = (domain: string, domainCookies: Cookie[]) => {
		return (
			<div key={domain} className='space-y-2'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<GlobeIcon className='w-4 h-4 text-blue-500' />
						<h3 className='text-sm font-medium'>{domain}</h3>
						<Badge variant='outline' className='text-xs'>
							{domainCookies.length}
						</Badge>
					</div>
					<Button variant='ghost' size='sm' onClick={() => handleDeleteDomain(domain)} className='text-red-500 hover:text-red-700'>
						<TrashIcon className='w-3 h-3' />
					</Button>
				</div>
				<div className='space-y-1 ml-6'>{domainCookies.map(cookie => renderCookieRow(cookie))}</div>
			</div>
		);
	};

	return (
		<div className={cn('flex flex-col h-full', className)}>
			{/* Header */}
			<div className='p-4 border-b'>
				<div className='flex items-center justify-between mb-3'>
					<div className='flex items-center gap-2'>
						<CookieIcon className='w-5 h-5' />
						<h2 className='text-lg font-semibold'>Cookie Manager</h2>
						<Badge variant='outline'>{stats.total} cookies</Badge>
					</div>
					<div className='flex items-center gap-2'>
						<Button size='sm' onClick={() => setIsImportDialogOpen(true)}>
							<UploadIcon className='w-4 h-4 mr-2' />
							Import
						</Button>
						<Button size='sm' onClick={() => setIsExportDialogOpen(true)}>
							<DownloadIcon className='w-4 h-4 mr-2' />
							Export
						</Button>
						<Button size='sm' onClick={() => console.log('Add new cookie')}>
							<PlusIcon className='w-4 h-4 mr-2' />
							Add
						</Button>
					</div>
				</div>

				{/* Search and Filters */}
				<div className='space-y-3'>
					<div className='relative'>
						<SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
						<Input placeholder='Search cookies...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='pl-10' />
					</div>

					<div className='flex items-center gap-4'>
						<Select value={selectedDomain} onValueChange={setSelectedDomain}>
							<SelectTrigger className='w-48'>
								<SelectValue placeholder='All domains' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All domains</SelectItem>
								{domains.map(domain => (
									<SelectItem key={domain} value={domain}>
										{domain}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className='flex items-center space-x-2'>
							<Switch id='show-expired' checked={showExpired} onCheckedChange={setShowExpired} />
							<Label htmlFor='show-expired' className='text-sm'>
								Show expired
							</Label>
						</div>

						<div className='flex items-center space-x-2'>
							<Switch id='secure-only' checked={showSecureOnly} onCheckedChange={setShowSecureOnly} />
							<Label htmlFor='secure-only' className='text-sm'>
								Secure only
							</Label>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<Tabs defaultValue='cookies' className='flex-1 flex flex-col'>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='cookies'>Cookies</TabsTrigger>
					<TabsTrigger value='stats'>Statistics</TabsTrigger>
					<TabsTrigger value='domains'>By Domain</TabsTrigger>
				</TabsList>

				{/* Cookies List */}
				<TabsContent value='cookies' className='flex-1'>
					<ScrollArea className='h-full'>
						<div className='p-4 space-y-2'>
							{filteredCookies.length === 0 ? (
								<div className='text-center py-8 text-muted-foreground'>
									<CookieIcon className='w-12 h-12 mx-auto mb-2 opacity-50' />
									<p>No cookies found</p>
								</div>
							) : (
								filteredCookies.map(cookie => renderCookieRow(cookie))
							)}
						</div>
					</ScrollArea>
				</TabsContent>

				{/* Statistics */}
				<TabsContent value='stats' className='flex-1'>
					<ScrollArea className='h-full'>
						<div className='p-4 space-y-4'>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
								{renderStatsCard('Total', stats.total, CookieIcon, 'text-blue-500')}
								{renderStatsCard('Session', stats.session, ClockIcon, 'text-orange-500')}
								{renderStatsCard('Persistent', stats.persistent, InfoIcon, 'text-green-500')}
								{renderStatsCard('Secure', stats.secure, ShieldIcon, 'text-blue-500')}
							</div>

							<Separator />

							<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
								{renderStatsCard('HttpOnly', stats.httpOnly, ShieldIcon, 'text-purple-500')}
								{renderStatsCard('Domains', stats.domains, GlobeIcon, 'text-indigo-500')}
								{renderStatsCard('Expired', stats.expired, AlertTriangleIcon, 'text-red-500')}
							</div>

							<Separator />

							<div className='space-y-2'>
								<h3 className='text-sm font-medium'>SameSite Distribution</h3>
								<div className='grid grid-cols-3 gap-4'>
									{renderStatsCard('Strict', stats.sameSiteStrict, CheckIcon, 'text-green-500')}
									{renderStatsCard('Lax', stats.sameSiteLax, InfoIcon, 'text-yellow-500')}
									{renderStatsCard('None', stats.sameSiteNone, AlertTriangleIcon, 'text-red-500')}
								</div>
							</div>
						</div>
					</ScrollArea>
				</TabsContent>

				{/* By Domain */}
				<TabsContent value='domains' className='flex-1'>
					<ScrollArea className='h-full'>
						<div className='p-4 space-y-4'>
							{domains.map(domain => {
								const domainCookies = filteredCookies.filter(cookie => cookie.domain === domain);
								if (domainCookies.length === 0) return null;
								return renderDomainSection(domain, domainCookies);
							})}
						</div>
					</ScrollArea>
				</TabsContent>
			</Tabs>

			{/* Import Dialog */}
			<Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Import Cookies</DialogTitle>
						<DialogDescription>Import cookies from various formats (JSON, Netscape, CSV)</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<p className='text-sm text-muted-foreground'>Cookie import functionality will be implemented here.</p>
						<div className='flex justify-end gap-2'>
							<Button variant='outline' onClick={() => setIsImportDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={() => setIsImportDialogOpen(false)}>Import</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Export Dialog */}
			<Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Export Cookies</DialogTitle>
						<DialogDescription>Export cookies in various formats</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<p className='text-sm text-muted-foreground'>Cookie export functionality will be implemented here.</p>
						<div className='flex justify-end gap-2'>
							<Button variant='outline' onClick={() => setIsExportDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={() => setIsExportDialogOpen(false)}>Export</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};
