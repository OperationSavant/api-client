import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, Trash2, Clock, CheckCircle, XCircle, Calendar, FileText, FolderPlus, ChevronDown, ChevronRight, X } from 'lucide-react';
import { HistoryFilter, HistoryItem, HistorySort } from '@/shared/types/history';
import { RootState } from '@/store/sidebar-store';
import { SidebarTabContext } from '@/shared/types/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { formatDate, getMethodColor, getStatusColor } from '@/lib/ui-utils';
import ApiClientButton from '../custom/api-client-button';
import { Checkbox } from '../ui/checkbox';

interface HistoryListProps {
	onRequestSelect?: (request: HistoryItem) => void;
	onSaveToCollection?: (historyId: string) => void;
	selectedHistoryId?: string;
	context?: SidebarTabContext;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export const HistoryList: React.FC<HistoryListProps> = ({ onRequestSelect, onSaveToCollection, selectedHistoryId, context }) => {
	const history = useSelector((state: RootState) => state.sidebarHistory.history);

	const [filter, setFilter] = useState<HistoryFilter>({});
	const [sort, setSort] = useState<HistorySort>({ field: 'timestamp', direction: 'desc' });
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
	const [showFilters, setShowFilters] = useState(false);
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
	const [groupBy, setGroupBy] = useState<string>('date');

	const highlightSearchTerm = (text: string, searchTerm: string) => {
		if (!searchTerm) {
			return text;
		}
		const parts: React.ReactNode[] = [];
		let lastIndex = 0;

		const regex = new RegExp(searchTerm, 'gi');
		let match;

		while ((match = regex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				parts.push(text.substring(lastIndex, match.index));
			}
			parts.push(
				<span key={match.index} className='bg-selection text-selection-foreground'>
					{match[0]}
				</span>
			);
			lastIndex = regex.lastIndex;
		}

		if (lastIndex < text.length) {
			parts.push(text.substring(lastIndex));
		}

		return <>{parts}</>;
	};

	useEffect(() => {
		setFilter(prev => ({ ...prev, searchTerm: searchTerm || undefined }));
	}, [searchTerm]);

	const handleDeleteItem = (id: string) => {
		if (window.confirm('Are you sure you want to delete this history item?')) {
			context?.sendToExtension({
				command: 'deleteHistoryItem',
				historyId: id,
				source: 'webviewView',
			});
			setSelectedItems(prev => {
				const newSet = new Set(prev);
				newSet.delete(id);
				return newSet;
			});
		}
	};

	const handleDeleteSelected = () => {
		if (selectedItems.size === 0) return;

		if (window.confirm(`Are you sure you want to delete ${selectedItems.size} selected items?`)) {
			selectedItems.forEach(id => {
				context?.sendToExtension({
					command: 'deleteHistoryItem',
					historyId: id,
					source: 'webviewView',
				});
			});
			setSelectedItems(new Set());
		}
	};

	const handleClearAll = () => {
		if (window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
			context?.sendToExtension({
				command: 'clearHistory',
				source: 'webviewView',
			});
			setSelectedItems(new Set());
		}
	};

	const handleExport = (format: 'json' = 'json') => {
		// const exportData = historyService.exportToFile(filter, format);
		// const blob = new Blob([exportData], {
		// 	type: 'application/json',
		// });
		// const url = URL.createObjectURL(blob);
		// const a = document.createElement('a');
		// a.href = url;
		// a.download = `api-history-${new Date().toISOString().split('T')[0]}.${format}`;
		// document.body.appendChild(a);
		// a.click();
		// document.body.removeChild(a);
		// URL.revokeObjectURL(url);
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedItems(new Set(history.map(item => item.historyId)));
		} else {
			setSelectedItems(new Set());
		}
	};

	const handleItemSelect = (id: string, checked: boolean) => {
		setSelectedItems(prev => {
			const newSet = new Set(prev);
			if (checked) {
				newSet.add(id);
			} else {
				newSet.delete(id);
			}
			return newSet;
		});
	};

	const toggleGroup = (groupName: string) => {
		setCollapsedGroups(prev => {
			const newSet = new Set(prev);
			if (newSet.has(groupName)) {
				newSet.delete(groupName);
			} else {
				newSet.add(groupName);
			}
			return newSet;
		});
	};

	const filteredAndSortedHistory = useMemo(() => {
		let filtered = [...history];
		if (filter.searchTerm) {
			const term = filter.searchTerm.toLowerCase();
			filtered = filtered.filter(item => item.request.url.toLowerCase().includes(term) || item.request.method.toLowerCase().includes(term));
		}

		if (filter.method && filter.method.length > 0) {
			filtered = filtered.filter(item => filter.method?.includes(item.request.method));
		}

		if (filter.status) {
			if (filter.status === 'success') {
				filtered = filtered.filter(item => item.success);
			} else if (filter.status === 'error') {
				filtered = filtered.filter(item => !item.success);
			}
		}

		filtered.sort((a, b) => {
			let aValue: any;
			let bValue: any;

			switch (sort.field) {
				case 'timestamp':
					aValue = new Date(a.timestamp).getTime();
					bValue = new Date(b.timestamp).getTime();
					break;
				case 'url':
					aValue = a.request.url.toLowerCase();
					bValue = b.request.url.toLowerCase();
					break;
				case 'status':
					aValue = a.response?.status || 0;
					bValue = b.response?.status || 0;
					break;
				case 'responseTime':
					aValue = a.response?.duration || 0;
					bValue = b.response?.duration || 0;
					break;
				default:
					return 0;
			}

			if (sort.direction === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});

		return filtered;
	}, [history, filter, sort]);

	const groupedHistory = useMemo(() => {
		if (groupBy === 'none' || !groupBy) {
			return { all: filteredAndSortedHistory };
		}

		const groups: { [key: string]: HistoryItem[] } = {};

		filteredAndSortedHistory.forEach(item => {
			let groupKey: string;
			if (groupBy === 'date') {
				const itemDate = new Date(item.timestamp);
				const today = new Date();
				const yesterday = new Date();
				yesterday.setDate(today.getDate() - 1);

				if (itemDate.toDateString() === today.toDateString()) {
					groupKey = 'Today';
				} else if (itemDate.toDateString() === yesterday.toDateString()) {
					groupKey = 'Yesterday';
				} else {
					groupKey = itemDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
				}
			} else if (groupBy === 'method') {
				groupKey = item.request.method;
			} else {
				groupKey = 'Unknown';
			}

			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}
			groups[groupKey].push(item);
		});

		if (groupBy === 'date') {
			const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
				if (a === 'Today') return -1;
				if (b === 'Today') return 1;
				if (a === 'Yesterday') return -1;
				if (b === 'Yesterday') return 1;
				return new Date(b).getTime() - new Date(a).getTime();
			});

			const sortedGroups: { [key: string]: HistoryItem[] } = {};
			for (const key of sortedGroupKeys) {
				sortedGroups[key] = groups[key];
			}
			return sortedGroups;
		}

		return groups;
	}, [groupBy, filteredAndSortedHistory]);

	useEffect(() => {
		if (searchTerm) {
			const groupsWithResults = Object.keys(groupedHistory);
			setCollapsedGroups(prev => {
				const newSet = new Set(prev);
				let changed = false;
				groupsWithResults.forEach(groupName => {
					if (newSet.has(groupName)) {
						newSet.delete(groupName);
						changed = true;
					}
				});
				return changed ? newSet : prev;
			});
		}
	}, [searchTerm, groupedHistory]);

	return (
		<>
			{history.length === 0 ? (
				<div className='flex-1 flex flex-col items-center justify-center text-center text-muted-foreground'>
					<Clock className='h-12 w-12 mx-auto mb-4 opacity-50' />
					<p className='text-sm'>No request history yet</p>
					<p className='text-xs opacity-70'>Your API requests will appear here automatically</p>
				</div>
			) : (
				<ScrollArea className='flex-1 w-full min-h-0'>
					<div className='pb-px flex flex-col items-center justify-between h-full w-full'>
						{Object.entries(groupedHistory).map(([groupName, items]) => {
							const isCollapsed = collapsedGroups.has(groupName);
							return (
								<div key={groupName} className='h-full w-full'>
									{groupBy !== 'none' && (
										<div
											className='flex w-full cursor-pointer items-center rounded-none bg-card px-1.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground my-2 group'
											onClick={() => toggleGroup(groupName)}>
											{isCollapsed ? <ChevronRight className='mr-2 h-4 w-4' /> : <ChevronDown className='mr-2 h-4 w-4' />}
											<span>{groupName}</span>
											<span className='ml-2 text-xs font-normal italic text-muted-foreground transition-colors group-hover:text-foreground'>
												({items.length})
											</span>
										</div>
									)}
									{!isCollapsed && (
										<div className='space-y-2 w-full flex flex-col'>
											{items.map(item => {
												const isSelected = selectedItems.has(item.historyId);
												const isActiveItem = selectedHistoryId === item.historyId;

												return (
													<Card
														key={item.historyId}
														className={`group flex w-full cursor-pointer transition-all duration-200 hover:shadow-sm ${
															isActiveItem ? 'border-primary bg-accent/50 shadow-sm' : 'border-border hover:border-primary/50 hover:bg-accent/30'
														}`}
														onClick={() => onRequestSelect?.(item)}>
														<CardContent className='p-2 flex w-full'>
															<div className='grid grid-cols-12 w-full'>
																<div className='col-span-1 items-start'>
																	<Checkbox
																		checked={isSelected}
																		onCheckedChange={e => {
																			handleItemSelect(item.historyId, e as boolean);
																		}}
																		className='mt-1 rounded border-border'
																	/>
																</div>
																<div className='col-span-9'>
																	<div className='mb-2 flex items-center gap-2'>
																		<Badge className={`text-xs font-medium ${getMethodColor(item.request.method)}`}>
																			{highlightSearchTerm(item.request.method, searchTerm)}
																		</Badge>
																		{item.response?.status && (
																			<Badge className={`text-xs ${getStatusColor(item.response.status)}`}>{item.response.status}</Badge>
																		)}
																		{item.success ? <CheckCircle className='h-3 w-3 text-green-500' /> : <XCircle className='h-3 w-3 text-destructive' />}
																	</div>

																	<div className='mb-2'>
																		<p className='truncate font-medium text-foreground' title={item.request.url}>
																			{highlightSearchTerm(item.request.url, searchTerm)}
																		</p>
																		{
																			<p className={`mt-1 text-xs ${item.error ? 'text-destructive' : 'text-primary-foreground'}`}>
																				{item.response?.statusText || item.error}
																			</p>
																		}
																	</div>

																	<div className='flex items-center gap-4 text-xs text-muted-foreground'>
																		<div className='flex items-center gap-1'>
																			<Calendar className='h-3 w-3' />
																			<span>{formatDate(item.timestamp)}</span>
																		</div>
																		{item.response?.duration && (
																			<div className='flex items-center gap-1'>
																				<Clock className='h-3 w-3' />
																				<span>{item.response.duration}ms</span>
																			</div>
																		)}
																		{item.collectionId && (
																			<div className='flex items-center gap-1'>
																				<FileText className='h-3 w-3' />
																				<span>In Collection</span>
																			</div>
																		)}
																	</div>
																</div>
																<div className='col-span-2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
																	<Button
																		variant='ghost'
																		size='sm'
																		className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
																		onClick={() => onSaveToCollection?.(item.historyId)}
																		title='Save to Collection'>
																		<FolderPlus className='h-4 w-4' />
																	</Button>
																	<Button
																		variant='ghost'
																		size='sm'
																		className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive'
																		onClick={() => handleDeleteItem(item.historyId)}
																		title='Delete'>
																		<Trash2 className='h-4 w-4' />
																	</Button>
																</div>
															</div>
														</CardContent>
													</Card>
												);
											})}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</ScrollArea>
			)}
		</>
	);
};

export default HistoryList;
