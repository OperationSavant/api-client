import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ApiClientButton from '@/components/custom/api-client-button';
import { Download, Filter, FolderPlus, Search, Trash2, X } from 'lucide-react';
import { SidebarTabContext } from '@/shared/types/tabs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/sidebar-store';
import { HistoryFilter, HistorySort } from '@/shared/types/history';
import { Checkbox } from '../ui/checkbox';
import ApiClientFieldRow from '../custom/api-client-field-row';
import { ApiClientSelect } from '../custom/api-client-select';
import { HTTP_VERBS_OPTIONS } from '@/shared/constants/select-options';
import HistoryList from './history-list';
import { useContainerBreakpoint } from '@/hooks/use-container-breakpoint';
import { cn } from '@/shared/lib/utils';

interface HistoryTabProps {
	context?: SidebarTabContext;
	handleExport: (format: 'json') => void;
	handleDeleteSelected: () => void;
	handleSelectAll: (selectAll: boolean) => void;
	handleClearAll: () => void;
}

const HistoryTab = ({ context, handleExport, handleDeleteSelected, handleSelectAll, handleClearAll }: HistoryTabProps) => {
	const [filter, setFilter] = useState<HistoryFilter>({});
	const [sort, setSort] = useState<HistorySort>({ field: 'timestamp', direction: 'desc' });
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
	const [showFilters, setShowFilters] = useState(false);
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
	const [groupBy, setGroupBy] = useState<string>('date');
	const { isCompact, isNormal, ref } = useContainerBreakpoint();
	const variant = isNormal ? 'outline' : 'ghost';
	const size = isCompact ? 'icon' : 'sm';

	return (
		<Card className='h-full border-border bg-card text-card-foreground flex flex-col px-2 py-2 gap-4 w-full'>
			<CardHeader className='grid grid-cols-2 gap-1.5 w-full items-center justify-between space-y-0 pb-4 px-0'>
				<CardTitle className={cn(`flex items-center justify-start w-full font-semibold text-foreground`, isCompact ? 'text-sm' : 'text-lg')}>
					Request History
				</CardTitle>
				<div ref={ref} className='flex items-center justify-end w-full gap-2'>
					<ApiClientButton
						variant={variant}
						size={size}
						onClick={() => setShowFilters(!showFilters)}
						className='border-border text-foreground hover:bg-accent hover:text-accent-foreground'>
						<Filter className='h-4 w-4 mr-1' />
						{isCompact ? '' : 'Options'}
					</ApiClientButton>
					<ApiClientButton
						variant={variant}
						size={size}
						onClick={() => handleExport('json')}
						className='border-border text-foreground hover:bg-accent hover:text-accent-foreground'>
						<Download className='h-4 w-4 mr-1' />
						{isCompact ? '' : 'Export'}
					</ApiClientButton>
				</div>
			</CardHeader>

			<CardContent className='flex flex-1 flex-col gap-4 min-h-0 px-0 w-full'>
				<div className='flex items-center gap-2'>
					<div className='relative flex-1'>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
						{searchTerm && (
							<X
								className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer'
								onClick={() => setSearchTerm('')}
							/>
						)}
						<Input
							placeholder='Search history...'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className='pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground'
						/>
					</div>
					{selectedItems.size > 0 && (
						<>
							<ApiClientButton variant='destructive' size='sm' onClick={handleDeleteSelected}>
								<Trash2 className='h-4 w-4 mr-1' />
								Delete ({selectedItems.size})
							</ApiClientButton>
							<ApiClientButton
								variant='outline'
								size='sm'
								onClick={() => {
									console.log('Save to collection:', Array.from(selectedItems));
								}}
								className='border-border text-foreground hover:bg-accent'>
								<FolderPlus className='h-4 w-4 mr-1' />
								Save to Collection
							</ApiClientButton>
						</>
					)}
				</div>
				{showFilters && (
					<Card className='border-border bg-muted/30 px-2 py-2 gap-4'>
						<CardContent className='px-0 space-y-3'>
							<div className='grid grid-cols-1 gap-3'>
								<div className='flex justify-between items-center w-full gap-4'>
									<ApiClientFieldRow label='Method' className='w-full'>
										<ApiClientSelect
											value={filter.method?.join(',') || 'all'}
											onValueChange={value => {
												if (value === 'all') {
													setFilter(prev => ({ ...prev, method: undefined }));
												} else {
													setFilter(prev => ({ ...prev, method: [value] }));
												}
											}}
											options={HTTP_VERBS_OPTIONS.reduce(
												(acc, curr) => {
													acc.push({ label: curr.label, value: curr.value });
													return acc;
												},
												[{ label: 'All methods', value: 'all' }]
											)}
											defaultOption={true}
											placeholder='All methods'
											classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
											classNameContent={`w-full`}
										/>
									</ApiClientFieldRow>
								</div>

								<div className='flex justify-between items-center w-full gap-4'>
									<ApiClientFieldRow label='Status' className='w-full'>
										<ApiClientSelect
											value={filter.status || 'all'}
											onValueChange={value => {
												setFilter(prev => ({
													...prev,
													status: value === 'all' ? undefined : (value as 'success' | 'error'),
												}));
											}}
											options={[
												{ label: 'All statuses', value: 'all' },
												{ label: 'Success', value: 'success' },
												{ label: 'Error', value: 'error' },
											]}
											placeholder='All statuses'
											classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
											classNameContent={`w-full`}
										/>
									</ApiClientFieldRow>
								</div>

								<div className='flex justify-between items-center w-full gap-4'>
									<ApiClientFieldRow label='Sort by' className='w-full'>
										<ApiClientSelect
											value={`${sort.field}-${sort.direction}`}
											onValueChange={value => {
												const [field, direction] = value.split('-');
												setSort({
													field: field as HistorySort['field'],
													direction: direction as 'asc' | 'desc',
												});
											}}
											options={[
												{ label: 'Latest first', value: 'timestamp-desc' },
												{ label: 'Oldest first', value: 'timestamp-asc' },
												{ label: 'URL A-Z', value: 'url-asc' },
												{ label: 'URL Z-A', value: 'url-desc' },
												{ label: 'Status ↑', value: 'status-asc' },
												{ label: 'Status ↓', value: 'status-desc' },
												{ label: 'Fastest first', value: 'responseTime-asc' },
												{ label: 'Slowest first', value: 'responseTime-desc' },
											]}
											placeholder='Sort by...'
											classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
											classNameContent={`w-full`}
										/>
									</ApiClientFieldRow>
								</div>

								<div className='flex justify-between items-center w-full gap-4'>
									<ApiClientFieldRow label='Group by' className='w-full'>
										<ApiClientSelect
											value={groupBy}
											onValueChange={setGroupBy}
											options={[
												{ label: 'Date', value: 'date' },
												{ label: 'Method', value: 'method' },
												{ label: 'None', value: 'none' },
											]}
											placeholder='Group by...'
											classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
											classNameContent={`w-full`}
										/>
									</ApiClientFieldRow>
								</div>
							</div>

							<div className='flex justify-between items-center'>
								<div className='flex items-center gap-2'>
									<Checkbox
										id='select-all'
										checked={selectedItems.size === history.length && history.length > 0}
										onCheckedChange={e => handleSelectAll(e as boolean)}
										className='rounded border-border'
									/>
									<label htmlFor='select-all' className='text-sm text-foreground'>
										Select all ({history.length} items)
									</label>
								</div>
								<ApiClientButton variant='destructive' size='sm' onClick={handleClearAll}>
									Clear All History
								</ApiClientButton>
							</div>
						</CardContent>
					</Card>
				)}
				<HistoryList context={context} />
			</CardContent>
		</Card>
	);
};

export default HistoryTab;
