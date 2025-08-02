import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Filter, Download, Upload, Eye, EyeOff, Edit, Trash2, Copy, Settings, Globe, Folder, FileText, Key, Type, Calendar } from 'lucide-react';
import { EnvironmentVariable, VariableScope, VariableFilter, VariableSort } from '@/types/environment';
import { getVariableTypeColor, getScopeColor } from '@/utils/theme-colors';
import { environmentService } from '@/services/environment-service';

interface EnvironmentListProps {
	onVariableSelect?: (variable: EnvironmentVariable) => void;
	selectedScope?: VariableScope;
	collectionId?: string;
	requestId?: string;
}

const VARIABLE_SCOPES: { value: VariableScope; label: string; icon: React.ReactNode }[] = [
	{ value: 'global', label: 'Global', icon: <Globe className='w-4 h-4' /> },
	{ value: 'collection', label: 'Collection', icon: <Folder className='w-4 h-4' /> },
	{ value: 'request', label: 'Request', icon: <FileText className='w-4 h-4' /> },
];

export const EnvironmentList: React.FC<EnvironmentListProps> = ({ onVariableSelect, selectedScope, collectionId, requestId }) => {
	const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
	const [filter, setFilter] = useState<VariableFilter>({});
	const [sort, setSort] = useState<VariableSort>({ field: 'updatedAt', direction: 'desc' });
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [selectedVariable, setSelectedVariable] = useState<EnvironmentVariable | null>(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());

	useEffect(() => {
		loadVariables();
	}, [filter, sort, selectedScope, collectionId]);

	useEffect(() => {
		setFilter(prev => ({ ...prev, searchTerm: searchTerm || undefined }));
	}, [searchTerm]);

	const loadVariables = () => {
		const filterToUse = {
			...filter,
			...(selectedScope && { scope: [selectedScope] }),
			...(collectionId && { collectionId }),
		};
		const variableData = environmentService.getVariables(filterToUse, sort);
		setVariables(variableData);
	};

	const handleDeleteVariable = (variable: EnvironmentVariable) => {
		if (window.confirm(`Are you sure you want to delete variable '${variable.key}'?`)) {
			const scopeId = findVariableScope(variable.id);
			if (scopeId) {
				const success = environmentService.deleteVariable(scopeId, variable.id);
				if (success) {
					loadVariables();
				}
			}
		}
	};

	const handleToggleEnabled = (variable: EnvironmentVariable) => {
		const scopeId = findVariableScope(variable.id);
		if (scopeId) {
			environmentService.updateVariable(scopeId, variable.id, { enabled: !variable.enabled });
			loadVariables();
		}
	};

	const handleToggleSecret = (variableId: string) => {
		setShowSecrets(prev => {
			const newSet = new Set(prev);
			if (newSet.has(variableId)) {
				newSet.delete(variableId);
			} else {
				newSet.add(variableId);
			}
			return newSet;
		});
	};

	const handleCopyVariable = (variable: EnvironmentVariable) => {
		navigator.clipboard.writeText(variable.value);
	};

	const handleExport = (format: 'json' | 'env' | 'csv' = 'json') => {
		const exportData = environmentService.exportVariables({
			format,
			scope: selectedScope ? [selectedScope] : undefined,
			includeSecrets: true,
			timestamp: new Date(),
		});

		const blob = new Blob([exportData], {
			type: format === 'json' ? 'application/json' : format === 'env' ? 'text/plain' : 'text/csv',
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `environment-variables-${new Date().toISOString().split('T')[0]}.${format}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const findVariableScope = (variableId: string): string | null => {
		const scopes = environmentService.getScopes();
		for (const scope of scopes) {
			if (scope.variables.some(v => v.id === variableId)) {
				return scope.id;
			}
		}
		return null;
	};

	const getScopeIcon = (scope: VariableScope) => {
		const scopeInfo = VARIABLE_SCOPES.find(s => s.value === scope);
		return scopeInfo?.icon || <Key className='w-4 h-4' />;
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<div className='flex flex-col h-full'>
			{/* Header */}
			<div className='flex items-center justify-between p-4 border-b'>
				<div className='flex items-center gap-2'>
					<Key className='w-5 h-5 text-muted-foreground' />
					<h2 className='text-lg font-semibold'>Environment Variables</h2>
					<Badge variant='secondary'>{variables.length}</Badge>
				</div>
				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' onClick={() => setShowFilters(!showFilters)}>
						<Filter className='w-4 h-4' />
						Filters
					</Button>
					<Button variant='outline' size='sm' onClick={() => handleExport('json')}>
						<Download className='w-4 h-4' />
						Export
					</Button>
					<Button size='sm' onClick={() => setShowAddForm(true)}>
						<Plus className='w-4 h-4' />
						Add Variable
					</Button>
				</div>
			</div>

			{/* Search and Filters */}
			<div className='p-4 space-y-4'>
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
					<Input placeholder='Search variables...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='pl-10' />
				</div>

				{showFilters && (
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg'>
						<div>
							<label className='text-sm font-medium mb-2 block'>Scope</label>
							<Select
								value={filter.scope?.[0] || 'all'}
								onValueChange={value =>
									setFilter(prev => ({
										...prev,
										scope: value === 'all' ? undefined : [value as VariableScope],
									}))
								}>
								<SelectTrigger>
									<SelectValue placeholder='All scopes' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Scopes</SelectItem>
									{VARIABLE_SCOPES.map(scope => (
										<SelectItem key={scope.value} value={scope.value}>
											<div className='flex items-center gap-2'>
												{scope.icon}
												{scope.label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className='text-sm font-medium mb-2 block'>Type</label>
							<Select
								value={filter.type?.[0] || 'all'}
								onValueChange={value =>
									setFilter(prev => ({
										...prev,
										type: value === 'all' ? undefined : [value as 'text' | 'secret'],
									}))
								}>
								<SelectTrigger>
									<SelectValue placeholder='All types' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Types</SelectItem>
									<SelectItem value='text'>Text</SelectItem>
									<SelectItem value='secret'>Secret</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className='text-sm font-medium mb-2 block'>Status</label>
							<Select
								value={filter.enabled === undefined ? 'all' : filter.enabled ? 'enabled' : 'disabled'}
								onValueChange={value =>
									setFilter(prev => ({
										...prev,
										enabled: value === 'all' ? undefined : value === 'enabled',
									}))
								}>
								<SelectTrigger>
									<SelectValue placeholder='All status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Status</SelectItem>
									<SelectItem value='enabled'>Enabled</SelectItem>
									<SelectItem value='disabled'>Disabled</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				)}
			</div>

			{/* Variables List */}
			<div className='flex-1 overflow-auto p-4'>
				{variables.length === 0 ? (
					<div className='flex flex-col items-center justify-center h-64 text-center'>
						<Key className='w-12 h-12 text-muted-foreground mb-4' />
						<h3 className='text-lg font-medium mb-2'>No Variables Found</h3>
						<p className='text-muted-foreground mb-4'>
							{searchTerm || filter.scope || filter.type || filter.enabled !== undefined
								? 'No variables match your current filters.'
								: 'Get started by adding your first environment variable.'}
						</p>
						<Button onClick={() => setShowAddForm(true)}>
							<Plus className='w-4 h-4 mr-2' />
							Add Variable
						</Button>
					</div>
				) : (
					<div className='space-y-2'>
						{variables.map(variable => (
							<Card
								key={variable.id}
								className={`cursor-pointer transition-colors hover:bg-accent/50 ${!variable.enabled ? 'opacity-60' : ''}`}
								onClick={() => {
									setSelectedVariable(variable);
									onVariableSelect?.(variable);
								}}>
								<CardContent className='p-4'>
									<div className='flex items-center justify-between'>
										<div className='flex-1 min-w-0'>
											<div className='flex items-center gap-3 mb-2'>
												<div className='flex items-center gap-2'>
													{getScopeIcon(variable.scope)}
													<span className='font-medium text-sm'>{variable.key}</span>
												</div>
												<div className='flex items-center gap-2'>
													<Badge className={getScopeColor(variable.scope)}>{variable.scope}</Badge>
													<Badge className={getVariableTypeColor(variable.type)}>{variable.type}</Badge>
													{!variable.enabled && <Badge variant='secondary'>disabled</Badge>}
												</div>
											</div>

											<div className='flex items-center gap-2 mb-2'>
												<span className='text-sm text-muted-foreground'>Value:</span>
												<code className='text-sm bg-muted px-2 py-1 rounded font-mono'>
													{variable.type === 'secret' && !showSecrets.has(variable.id) ? '••••••••' : variable.value || '<empty>'}
												</code>
												{variable.type === 'secret' && (
													<Button
														variant='ghost'
														size='sm'
														onClick={e => {
															e.stopPropagation();
															handleToggleSecret(variable.id);
														}}>
														{showSecrets.has(variable.id) ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
													</Button>
												)}
											</div>

											{variable.description && <p className='text-sm text-muted-foreground mb-2'>{variable.description}</p>}

											<div className='flex items-center gap-4 text-xs text-muted-foreground'>
												<div className='flex items-center gap-1'>
													<Calendar className='w-3 h-3' />
													<span>Updated {formatDate(variable.updatedAt)}</span>
												</div>
											</div>
										</div>

										<div className='flex items-center gap-1 ml-4'>
											<Button
												variant='ghost'
												size='sm'
												onClick={e => {
													e.stopPropagation();
													handleCopyVariable(variable);
												}}
												title='Copy value'>
												<Copy className='w-4 h-4' />
											</Button>
											<Switch
												checked={variable.enabled}
												onCheckedChange={(checked: boolean) => {
													handleToggleEnabled(variable);
												}}
												onClick={(e: React.MouseEvent) => e.stopPropagation()}
												title={variable.enabled ? 'Disable variable' : 'Enable variable'}
											/>
											<Button
												variant='ghost'
												size='sm'
												onClick={e => {
													e.stopPropagation();
													setSelectedVariable(variable);
													setShowAddForm(true);
												}}
												title='Edit variable'>
												<Edit className='w-4 h-4' />
											</Button>
											<Button
												variant='ghost'
												size='sm'
												onClick={e => {
													e.stopPropagation();
													handleDeleteVariable(variable);
												}}
												title='Delete variable'>
												<Trash2 className='w-4 h-4' />
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Add/Edit Variable Form would be rendered here as a modal */}
			{/* This would be implemented as a separate component */}
		</div>
	);
};
