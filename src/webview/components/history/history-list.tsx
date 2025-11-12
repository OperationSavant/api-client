// import React, { useState, useEffect, useMemo } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Search, Filter, Download, Trash2, Clock, CheckCircle, XCircle, MoreHorizontal, Calendar, BarChart3, FileText, FolderPlus } from 'lucide-react';
// import { HistoryFilter, HistoryItem, HistorySort } from '@/shared/types/history';
// import { historyService } from '@/services/history-service';

// interface HistoryListProps {
// 	onRequestSelect?: (request: HistoryItem) => void;
// 	onSaveToCollection?: (historyId: string) => void;
// 	selectedHistoryId?: string;
// }

// const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

// export const HistoryList: React.FC<HistoryListProps> = ({ onRequestSelect, onSaveToCollection, selectedHistoryId }) => {
// 	const [history, setHistory] = useState<HistoryItem[]>([]);
// 	const [filter, setFilter] = useState<HistoryFilter>({});
// 	const [sort, setSort] = useState<HistorySort>({ field: 'timestamp', direction: 'desc' });
// 	const [searchTerm, setSearchTerm] = useState('');
// 	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
// 	const [showFilters, setShowFilters] = useState(false);

// 	useEffect(() => {
// 		loadHistory();
// 	}, [filter, sort]);

// 	useEffect(() => {
// 		setFilter(prev => ({ ...prev, searchTerm: searchTerm || undefined }));
// 	}, [searchTerm]);

// 	const loadHistory = () => {
// 		// const historyData = historyService.getHistory(filter, sort);
// 		// setHistory(historyData);
// 	};

// 	const handleDeleteItem = (id: string) => {
// 		// if (window.confirm('Are you sure you want to delete this history item?')) {
// 		// 	const success = historyService.deleteHistoryItem(id);
// 		// 	if (success) {
// 		// 		loadHistory();
// 		// 		setSelectedItems(prev => {
// 		// 			const newSet = new Set(prev);
// 		// 			newSet.delete(id);
// 		// 			return newSet;
// 		// 		});
// 		// 	}
// 		// }
// 	};

// 	const handleDeleteSelected = () => {
// 		if (selectedItems.size === 0) return;

// 		if (window.confirm(`Are you sure you want to delete ${selectedItems.size} selected items?`)) {
// 			// const deletedCount = historyService.deleteMultipleItems(Array.from(selectedItems));
// 			// if (deletedCount > 0) {
// 			// 	loadHistory();
// 			// 	setSelectedItems(new Set());
// 			// }
// 		}
// 	};

// 	const handleClearAll = () => {
// 		if (window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
// 			historyService.clearHistory();
// 			loadHistory();
// 			setSelectedItems(new Set());
// 		}
// 	};

// 	const handleExport = (format: 'json' | 'csv' | 'har' = 'json') => {
// 		// const exportData = historyService.exportToFile(filter, format);
// 		// const blob = new Blob([exportData], {
// 		// 	type: format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'application/json',
// 		// });
// 		// const url = URL.createObjectURL(blob);
// 		// const a = document.createElement('a');
// 		// a.href = url;
// 		// a.download = `api-history-${new Date().toISOString().split('T')[0]}.${format}`;
// 		// document.body.appendChild(a);
// 		// a.click();
// 		// document.body.removeChild(a);
// 		// URL.revokeObjectURL(url);
// 	};

// 	const handleSelectAll = (checked: boolean) => {
// 		if (checked) {
// 			setSelectedItems(new Set(history.map(item => item.historyId)));
// 		} else {
// 			setSelectedItems(new Set());
// 		}
// 	};

// 	const handleItemSelect = (id: string, checked: boolean) => {
// 		setSelectedItems(prev => {
// 			const newSet = new Set(prev);
// 			if (checked) {
// 				newSet.add(id);
// 			} else {
// 				newSet.delete(id);
// 			}
// 			return newSet;
// 		});
// 	};

// 	const getStatusColor = (status?: number) => {
// 		if (!status) return 'bg-muted text-muted-foreground';
// 		if (status >= 200 && status < 300) return 'bg-green-500/20 text-green-600 dark:text-green-400';
// 		if (status >= 400 && status < 500) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
// 		if (status >= 500) return 'bg-red-500/20 text-red-600 dark:text-red-400';
// 		return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
// 	};

// 	const getMethodColor = (method: string) => {
// 		const colors = {
// 			GET: 'bg-green-500/20 text-green-600 dark:text-green-400',
// 			POST: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
// 			PUT: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
// 			DELETE: 'bg-red-500/20 text-red-600 dark:text-red-400',
// 			PATCH: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
// 			HEAD: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
// 			OPTIONS: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
// 		};
// 		return colors[method as keyof typeof colors] || 'bg-muted text-muted-foreground';
// 	};

// 	const formatDate = (date: Date) => {
// 		const now = new Date();
// 		const diffMs = now.getTime() - date.getTime();
// 		const diffHours = diffMs / (1000 * 60 * 60);
// 		const diffDays = diffMs / (1000 * 60 * 60 * 24);

// 		if (diffHours < 1) {
// 			const diffMinutes = Math.floor(diffMs / (1000 * 60));
// 			return `${diffMinutes}m ago`;
// 		} else if (diffHours < 24) {
// 			return `${Math.floor(diffHours)}h ago`;
// 		} else if (diffDays < 7) {
// 			return `${Math.floor(diffDays)}d ago`;
// 		} else {
// 			return date.toLocaleDateString();
// 		}
// 	};

// 	const filteredAndSortedHistory = useMemo(() => history, [history]);

// 	return (
// 		<Card className='h-full border-border bg-card text-card-foreground'>
// 			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
// 				<CardTitle className='text-lg font-semibold text-foreground'>Request History</CardTitle>
// 				<div className='flex items-center gap-2'>
// 					<Button
// 						variant='outline'
// 						size='sm'
// 						onClick={() => setShowFilters(!showFilters)}
// 						className='border-border text-foreground hover:bg-accent hover:text-accent-foreground'>
// 						<Filter className='h-4 w-4 mr-1' />
// 						Filter
// 					</Button>
// 					<Button
// 						variant='outline'
// 						size='sm'
// 						onClick={() => handleExport('json')}
// 						className='border-border text-foreground hover:bg-accent hover:text-accent-foreground'>
// 						<Download className='h-4 w-4 mr-1' />
// 						Export
// 					</Button>
// 				</div>
// 			</CardHeader>

// 			<CardContent className='space-y-4'>
// 				{/* Search and Quick Actions */}
// 				<div className='flex items-center gap-2'>
// 					<div className='relative flex-1'>
// 						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
// 						<Input
// 							placeholder='Search history...'
// 							value={searchTerm}
// 							onChange={e => setSearchTerm(e.target.value)}
// 							className='pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground'
// 						/>
// 					</div>
// 					{selectedItems.size > 0 && (
// 						<>
// 							<Button variant='outline' size='sm' onClick={handleDeleteSelected} className='border-border text-destructive hover:bg-destructive/10'>
// 								<Trash2 className='h-4 w-4 mr-1' />
// 								Delete ({selectedItems.size})
// 							</Button>
// 							<Button
// 								variant='outline'
// 								size='sm'
// 								onClick={() => {
// 									// Handle bulk save to collection
// 									console.log('Save to collection:', Array.from(selectedItems));
// 								}}
// 								className='border-border text-foreground hover:bg-accent'>
// 								<FolderPlus className='h-4 w-4 mr-1' />
// 								Save to Collection
// 							</Button>
// 						</>
// 					)}
// 				</div>

// 				{/* Advanced Filters */}
// 				{showFilters && (
// 					<Card className='border-border bg-muted/30'>
// 						<CardContent className='p-4 space-y-3'>
// 							<div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
// 								<div>
// 									<label className='text-sm font-medium text-foreground mb-1 block'>Method</label>
// 									<Select
// 										value={filter.method?.join(',') || 'all'}
// 										onValueChange={value => {
// 											if (value === 'all') {
// 												setFilter(prev => ({ ...prev, method: undefined }));
// 											} else {
// 												setFilter(prev => ({ ...prev, method: [value] }));
// 											}
// 										}}>
// 										<SelectTrigger className='bg-input border-border text-foreground'>
// 											<SelectValue placeholder='All methods' />
// 										</SelectTrigger>
// 										<SelectContent className='bg-popover border-border'>
// 											<SelectItem value='all'>All methods</SelectItem>
// 											{HTTP_METHODS.map(method => (
// 												<SelectItem key={method} value={method}>
// 													{method}
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>

// 								<div>
// 									<label className='text-sm font-medium text-foreground mb-1 block'>Status</label>
// 									<Select
// 										value={filter.status || 'all'}
// 										onValueChange={value => {
// 											setFilter(prev => ({
// 												...prev,
// 												status: value === 'all' ? undefined : (value as 'success' | 'error'),
// 											}));
// 										}}>
// 										<SelectTrigger className='bg-input border-border text-foreground'>
// 											<SelectValue placeholder='All statuses' />
// 										</SelectTrigger>
// 										<SelectContent className='bg-popover border-border'>
// 											<SelectItem value='all'>All statuses</SelectItem>
// 											<SelectItem value='success'>Success</SelectItem>
// 											<SelectItem value='error'>Error</SelectItem>
// 										</SelectContent>
// 									</Select>
// 								</div>

// 								<div>
// 									<label className='text-sm font-medium text-foreground mb-1 block'>Sort by</label>
// 									<Select
// 										value={`${sort.field}-${sort.direction}`}
// 										onValueChange={value => {
// 											const [field, direction] = value.split('-');
// 											setSort({
// 												field: field as HistorySort['field'],
// 												direction: direction as 'asc' | 'desc',
// 											});
// 										}}>
// 										<SelectTrigger className='bg-input border-border text-foreground'>
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent className='bg-popover border-border'>
// 											<SelectItem value='timestamp-desc'>Latest first</SelectItem>
// 											<SelectItem value='timestamp-asc'>Oldest first</SelectItem>
// 											<SelectItem value='url-asc'>URL A-Z</SelectItem>
// 											<SelectItem value='url-desc'>URL Z-A</SelectItem>
// 											<SelectItem value='status-asc'>Status ↑</SelectItem>
// 											<SelectItem value='status-desc'>Status ↓</SelectItem>
// 											<SelectItem value='responseTime-asc'>Fastest first</SelectItem>
// 											<SelectItem value='responseTime-desc'>Slowest first</SelectItem>
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>

// 							<div className='flex justify-between items-center'>
// 								<div className='flex items-center gap-2'>
// 									<input
// 										type='checkbox'
// 										id='select-all'
// 										checked={selectedItems.size === history.length && history.length > 0}
// 										onChange={e => handleSelectAll(e.target.checked)}
// 										className='rounded border-border'
// 									/>
// 									<label htmlFor='select-all' className='text-sm text-foreground'>
// 										Select all ({history.length} items)
// 									</label>
// 								</div>
// 								<Button variant='ghost' size='sm' onClick={handleClearAll} className='text-destructive hover:bg-destructive/10'>
// 									Clear All History
// 								</Button>
// 							</div>
// 						</CardContent>
// 					</Card>
// 				)}

// 				{/* History List */}
// 				{history.length === 0 ? (
// 					<div className='text-center py-8 text-muted-foreground'>
// 						<Clock className='h-12 w-12 mx-auto mb-4 opacity-50' />
// 						<p className='text-sm'>No request history yet</p>
// 						<p className='text-xs opacity-70'>Your API requests will appear here automatically</p>
// 					</div>
// 				) : (
// 					<div className='space-y-2 max-h-[60vh] overflow-y-auto'>
// 						{filteredAndSortedHistory.map(item => {
// 							const isSelected = selectedItems.has(item.historyId);
// 							const isActiveItem = selectedHistoryId === item.historyId;

// 							return (
// 								<Card
// 									key={item.historyId}
// 									className={`cursor-pointer transition-all duration-200 hover:shadow-sm group ${
// 										isActiveItem ? 'border-primary bg-accent/50 shadow-sm' : 'border-border hover:border-primary/50 hover:bg-accent/30'
// 									}`}
// 									onClick={() => onRequestSelect?.(item)}>
// 									<CardContent className='p-3'>
// 										<div className='flex items-start justify-between'>
// 											<div className='flex items-start gap-3 flex-1 min-w-0'>
// 												<input
// 													type='checkbox'
// 													checked={isSelected}
// 													onChange={e => {
// 														e.stopPropagation();
// 														handleItemSelect(item.historyId, e.target.checked);
// 													}}
// 													className='mt-1 rounded border-border'
// 												/>

// 												<div className='flex-1 min-w-0'>
// 													<div className='flex items-center gap-2 mb-2'>
// 														<Badge className={`text-xs font-medium ${getMethodColor(item.request.method)}`}>{item.request.method}</Badge>
// 														{item.response?.status && <Badge className={`text-xs ${getStatusColor(item.response.status)}`}>{item.response.status}</Badge>}
// 														{item.success ? <CheckCircle className='h-3 w-3 text-green-500' /> : <XCircle className='h-3 w-3 text-red-500' />}
// 													</div>

// 													<div className='mb-2'>
// 														<p className='font-medium text-foreground truncate' title={item.request.url}>
// 															{item.request.url}
// 														</p>
// 														{item.error && <p className='text-xs text-destructive mt-1'>{item.error}</p>}
// 													</div>

// 													<div className='flex items-center gap-4 text-xs text-muted-foreground'>
// 														<div className='flex items-center gap-1'>
// 															<Calendar className='h-3 w-3' />
// 															<span>{formatDate(item.timestamp)}</span>
// 														</div>
// 														{item.response?.duration && (
// 															<div className='flex items-center gap-1'>
// 																<Clock className='h-3 w-3' />
// 																<span>{item.response.duration}ms</span>
// 															</div>
// 														)}
// 														{item.collectionId && (
// 															<div className='flex items-center gap-1'>
// 																<FileText className='h-3 w-3' />
// 																<span>In Collection</span>
// 															</div>
// 														)}
// 													</div>
// 												</div>
// 											</div>

// 											<div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
// 												<Button
// 													variant='ghost'
// 													size='sm'
// 													className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
// 													onClick={e => {
// 														e.stopPropagation();
// 														onSaveToCollection?.(item.historyId);
// 													}}
// 													title='Save to Collection'>
// 													<FolderPlus className='h-4 w-4' />
// 												</Button>
// 												<Button
// 													variant='ghost'
// 													size='sm'
// 													className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive'
// 													onClick={e => {
// 														e.stopPropagation();
// 														handleDeleteItem(item.historyId);
// 													}}
// 													title='Delete'>
// 													<Trash2 className='h-4 w-4' />
// 												</Button>
// 											</div>
// 										</div>
// 									</CardContent>
// 								</Card>
// 							);
// 						})}
// 					</div>
// 				)}
// 			</CardContent>
// 		</Card>
// 	);
// };

// export default HistoryList;
