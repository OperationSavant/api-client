// import React, { useState, useEffect } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Switch } from '@/components/ui/switch';
// import { Label } from '@/components/ui/label';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Badge } from '@/components/ui/badge';
// import { Save, X, AlertCircle, Eye, EyeOff, Globe, Folder, FileText, Key, Type, Hash } from 'lucide-react';
// import { EnvironmentVariable, VariableScope, EnvironmentScope } from '@/shared/types/environment';
// import { environmentService } from '@/services/environment-service';

// interface VariableEditorProps {
// 	isOpen: boolean;
// 	onClose: () => void;
// 	variable?: EnvironmentVariable | null;
// 	defaultScope?: VariableScope;
// 	collectionId?: string;
// 	requestId?: string;
// 	onSave?: (variable: EnvironmentVariable) => void;
// }

// const VARIABLE_SCOPES: { value: VariableScope; label: string; icon: React.ReactNode; description: string }[] = [
// 	{
// 		value: 'global',
// 		label: 'Global',
// 		icon: <Globe className='w-4 h-4' />,
// 		description: 'Available across all collections and requests',
// 	},
// 	{
// 		value: 'collection',
// 		label: 'Collection',
// 		icon: <Folder className='w-4 h-4' />,
// 		description: 'Available within the selected collection only',
// 	},
// 	{
// 		value: 'request',
// 		label: 'Request',
// 		icon: <FileText className='w-4 h-4' />,
// 		description: 'Available for this specific request only',
// 	},
// ];

// export const VariableEditor: React.FC<VariableEditorProps> = ({ isOpen, onClose, variable, defaultScope = 'global', collectionId, requestId, onSave }) => {
// 	const [formData, setFormData] = useState({
// 		key: '',
// 		value: '',
// 		description: '',
// 		type: 'text' as 'text' | 'secret',
// 		scope: defaultScope,
// 		enabled: true,
// 	});
// 	const [scopes, setScopes] = useState<EnvironmentScope[]>([]);
// 	const [selectedScopeId, setSelectedScopeId] = useState<string>('');
// 	const [showValue, setShowValue] = useState(false);
// 	const [errors, setErrors] = useState<Record<string, string>>({});
// 	const [isLoading, setIsLoading] = useState(false);

// 	useEffect(() => {
// 		if (isOpen) {
// 			loadScopes();
// 			if (variable) {
// 				setFormData({
// 					key: variable.key,
// 					value: variable.value,
// 					description: variable.description || '',
// 					type: variable.type,
// 					scope: variable.scope,
// 					enabled: variable.enabled,
// 				});
// 				setShowValue(variable.type !== 'secret');
// 			} else {
// 				resetForm();
// 			}
// 		}
// 	}, [isOpen, variable, defaultScope]);

// 	const loadScopes = () => {
// 		const allScopes = environmentService.getScopes();
// 		setScopes(allScopes);

// 		// Find or create appropriate scope
// 		if (variable) {
// 			const existingScope = allScopes.find(s => s.variables.some(v => v.id === variable.id));
// 			if (existingScope) {
// 				setSelectedScopeId(existingScope.id);
// 			}
// 		} else {
// 			// Find or create scope based on context
// 			let targetScope = allScopes.find(s => {
// 				if (formData.scope === 'global') return s.type === 'global';
// 				if (formData.scope === 'collection') return s.type === 'collection' && s.collectionId === collectionId;
// 				if (formData.scope === 'request') return s.type === 'request' && s.requestId === requestId;
// 				return false;
// 			});

// 			if (!targetScope) {
// 				// Create new scope if it doesn't exist
// 				const scopeName = formData.scope === 'global' ? 'Global Variables' : formData.scope === 'collection' ? `Collection Variables` : `Request Variables`;

// 				targetScope = environmentService.createScope(scopeName, formData.scope, collectionId, requestId);
// 			}

// 			setSelectedScopeId(targetScope.id);
// 		}
// 	};

// 	const resetForm = () => {
// 		setFormData({
// 			key: '',
// 			value: '',
// 			description: '',
// 			type: 'text',
// 			scope: defaultScope,
// 			enabled: true,
// 		});
// 		setShowValue(true);
// 		setErrors({});
// 	};

// 	const validateForm = (): boolean => {
// 		const newErrors: Record<string, string> = {};

// 		// Validate key
// 		if (!formData.key.trim()) {
// 			newErrors.key = 'Variable key is required';
// 		} else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.key)) {
// 			newErrors.key = 'Key must start with a letter or underscore and contain only letters, numbers, and underscores';
// 		}

// 		// Check for duplicate keys in the same scope
// 		const targetScope = scopes.find(s => s.id === selectedScopeId);
// 		if (targetScope) {
// 			const duplicateVariable = targetScope.variables.find(v => v.key === formData.key && v.id !== variable?.id);
// 			if (duplicateVariable) {
// 				newErrors.key = `Variable with key '${formData.key}' already exists in this scope`;
// 			}
// 		}

// 		// Validate scope selection
// 		if (!selectedScopeId) {
// 			newErrors.scope = 'Please select a scope for the variable';
// 		}

// 		setErrors(newErrors);
// 		return Object.keys(newErrors).length === 0;
// 	};

// 	const handleSave = async () => {
// 		if (!validateForm()) return;

// 		setIsLoading(true);
// 		try {
// 			let savedVariable: EnvironmentVariable | null = null;

// 			if (variable) {
// 				// Update existing variable
// 				const success = environmentService.updateVariable(selectedScopeId, variable.id, {
// 					key: formData.key,
// 					value: formData.value,
// 					description: formData.description || undefined,
// 					type: formData.type,
// 					enabled: formData.enabled,
// 				});

// 				if (success) {
// 					savedVariable = environmentService.getVariable(selectedScopeId, variable.id) || null;
// 				}
// 			} else {
// 				// Create new variable
// 				savedVariable = environmentService.addVariable(selectedScopeId, {
// 					key: formData.key,
// 					value: formData.value,
// 					description: formData.description || undefined,
// 					type: formData.type,
// 					scope: formData.scope,
// 					enabled: formData.enabled,
// 				});
// 			}

// 			if (savedVariable) {
// 				onSave?.(savedVariable);
// 				onClose();
// 			}
// 		} catch (error) {
// 			setErrors({ general: error instanceof Error ? error.message : 'Failed to save variable' });
// 		} finally {
// 			setIsLoading(false);
// 		}
// 	};

// 	const handleScopeChange = (newScope: VariableScope) => {
// 		setFormData(prev => ({ ...prev, scope: newScope }));

// 		// Find or create appropriate scope
// 		let targetScope = scopes.find(s => {
// 			if (newScope === 'global') return s.type === 'global';
// 			if (newScope === 'collection') return s.type === 'collection' && s.collectionId === collectionId;
// 			if (newScope === 'request') return s.type === 'request' && s.requestId === requestId;
// 			return false;
// 		});

// 		if (!targetScope) {
// 			const scopeName = newScope === 'global' ? 'Global Variables' : newScope === 'collection' ? `Collection Variables` : `Request Variables`;

// 			targetScope = environmentService.createScope(scopeName, newScope, collectionId, requestId);
// 			setScopes(prev => [...prev, targetScope!]);
// 		}

// 		setSelectedScopeId(targetScope.id);
// 	};

// 	const getScopeInfo = (scope: VariableScope) => {
// 		return VARIABLE_SCOPES.find(s => s.value === scope);
// 	};

// 	return (
// 		<Dialog open={isOpen} onOpenChange={onClose}>
// 			<DialogContent className='sm:max-w-[600px]'>
// 				<DialogHeader>
// 					<DialogTitle className='flex items-center gap-2'>
// 						<Key className='w-5 h-5' />
// 						{variable ? 'Edit Variable' : 'Add Variable'}
// 					</DialogTitle>
// 				</DialogHeader>

// 				<div className='space-y-6'>
// 					{errors.general && (
// 						<Alert variant='destructive'>
// 							<AlertCircle className='h-4 w-4' />
// 							<AlertDescription>{errors.general}</AlertDescription>
// 						</Alert>
// 					)}

// 					{/* Variable Key */}
// 					<div className='space-y-2'>
// 						<Label htmlFor='key'>Variable Key *</Label>
// 						<Input
// 							id='key'
// 							placeholder='Enter variable key (e.g., API_URL)'
// 							value={formData.key}
// 							onChange={e => setFormData(prev => ({ ...prev, key: e.target.value }))}
// 							className={errors.key ? 'border-red-500' : ''}
// 						/>
// 						{errors.key && <p className='text-sm text-red-500'>{errors.key}</p>}
// 						<p className='text-xs text-muted-foreground'>
// 							Use in requests as: <code className='bg-muted px-1 py-0.5 rounded'>{'{{' + formData.key + '}}'}</code>
// 						</p>
// 					</div>

// 					{/* Variable Value */}
// 					<div className='space-y-2'>
// 						<div className='flex items-center justify-between'>
// 							<Label htmlFor='value'>Variable Value</Label>
// 							{formData.type === 'secret' && (
// 								<Button type='button' variant='ghost' size='sm' onClick={() => setShowValue(!showValue)}>
// 									{showValue ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
// 									{showValue ? 'Hide' : 'Show'}
// 								</Button>
// 							)}
// 						</div>
// 						<Textarea
// 							id='value'
// 							placeholder='Enter variable value'
// 							value={formData.value}
// 							onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
// 							rows={3}
// 						/>
// 					</div>

// 					{/* Variable Type */}
// 					<div className='space-y-2'>
// 						<Label>Variable Type</Label>
// 						<div className='flex gap-4'>
// 							<label className='flex items-center space-x-2 cursor-pointer'>
// 								<input
// 									type='radio'
// 									name='type'
// 									value='text'
// 									checked={formData.type === 'text'}
// 									onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as 'text' | 'secret' }))}
// 									className='w-4 h-4'
// 								/>
// 								<div className='flex items-center gap-2'>
// 									<Type className='w-4 h-4' />
// 									<span>Text</span>
// 									<Badge variant='secondary'>visible</Badge>
// 								</div>
// 							</label>
// 							<label className='flex items-center space-x-2 cursor-pointer'>
// 								<input
// 									type='radio'
// 									name='type'
// 									value='secret'
// 									checked={formData.type === 'secret'}
// 									onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as 'text' | 'secret' }))}
// 									className='w-4 h-4'
// 								/>
// 								<div className='flex items-center gap-2'>
// 									<Hash className='w-4 h-4' />
// 									<span>Secret</span>
// 									<Badge variant='destructive'>masked</Badge>
// 								</div>
// 							</label>
// 						</div>
// 					</div>

// 					{/* Variable Scope */}
// 					<div className='space-y-2'>
// 						<Label>Variable Scope</Label>
// 						<div className='space-y-3'>
// 							{VARIABLE_SCOPES.map(scope => {
// 								const isDisabled = (scope.value === 'collection' && !collectionId) || (scope.value === 'request' && !requestId);
// 								return (
// 									<label
// 										key={scope.value}
// 										className={`flex items-start space-x-3 cursor-pointer p-3 border rounded-lg transition-colors ${
// 											formData.scope === scope.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
// 										} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
// 										<input
// 											type='radio'
// 											name='scope'
// 											value={scope.value}
// 											checked={formData.scope === scope.value}
// 											onChange={e => handleScopeChange(e.target.value as VariableScope)}
// 											disabled={isDisabled}
// 											className='w-4 h-4 mt-0.5'
// 										/>
// 										<div className='flex-1'>
// 											<div className='flex items-center gap-2 mb-1'>
// 												{scope.icon}
// 												<span className='font-medium'>{scope.label}</span>
// 											</div>
// 											<p className='text-sm text-muted-foreground'>{scope.description}</p>
// 											{isDisabled && (
// 												<p className='text-xs text-red-500 mt-1'>
// 													{scope.value === 'collection' ? 'No collection context available' : 'No request context available'}
// 												</p>
// 											)}
// 										</div>
// 									</label>
// 								);
// 							})}
// 						</div>
// 					</div>

// 					{/* Description */}
// 					<div className='space-y-2'>
// 						<Label htmlFor='description'>Description (Optional)</Label>
// 						<Textarea
// 							id='description'
// 							placeholder='Describe what this variable is used for...'
// 							value={formData.description}
// 							onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
// 							rows={2}
// 						/>
// 					</div>

// 					{/* Enabled Toggle */}
// 					<div className='flex items-center space-x-2'>
// 						<Switch id='enabled' checked={formData.enabled} onCheckedChange={checked => setFormData(prev => ({ ...prev, enabled: checked }))} />
// 						<Label htmlFor='enabled'>Enable this variable</Label>
// 					</div>
// 				</div>

// 				<DialogFooter>
// 					<Button variant='outline' onClick={onClose} disabled={isLoading}>
// 						<X className='w-4 h-4 mr-2' />
// 						Cancel
// 					</Button>
// 					<Button onClick={handleSave} disabled={isLoading}>
// 						<Save className='w-4 h-4 mr-2' />
// 						{isLoading ? 'Saving...' : variable ? 'Update Variable' : 'Create Variable'}
// 					</Button>
// 				</DialogFooter>
// 			</DialogContent>
// 		</Dialog>
// 	);
// };
