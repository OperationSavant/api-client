/**
 * Cookie Editor Component
 * Dialog for creating and editing individual cookies
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon, ShieldIcon, AlertTriangleIcon, CheckIcon, XIcon } from 'lucide-react';
import { Cookie, CookieEditorProps, CookieValidationResult } from '@/shared/types/cookie';

export const CookieEditor: React.FC<CookieEditorProps> = ({ cookie, isOpen, onSave, onCancel, onDelete }) => {
	const [formData, setFormData] = useState<Partial<Cookie>>({
		name: '',
		value: '',
		domain: '',
		path: '/',
		secure: false,
		httpOnly: false,
		sameSite: 'Lax',
		session: true,
		hostOnly: true,
		...cookie,
	});

	const [expiresDate, setExpiresDate] = useState<Date | undefined>(cookie?.expires);
	const [maxAgeValue, setMaxAgeValue] = useState<string>(cookie?.maxAge?.toString() || '');
	const [validation, setValidation] = useState<CookieValidationResult>({ valid: true, errors: [], warnings: [] });

	useEffect(() => {
		if (cookie) {
			setFormData({ ...cookie });
			setExpiresDate(cookie.expires);
			setMaxAgeValue(cookie.maxAge?.toString() || '');
		} else {
			// Reset form for new cookie
			setFormData({
				name: '',
				value: '',
				domain: '',
				path: '/',
				secure: false,
				httpOnly: false,
				sameSite: 'Lax',
				session: true,
				hostOnly: true,
			});
			setExpiresDate(undefined);
			setMaxAgeValue('');
		}
	}, [cookie, isOpen]);

	useEffect(() => {
		validateForm();
	}, [formData, expiresDate, maxAgeValue]);

	const validateForm = (): void => {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Name validation
		if (!formData.name?.trim()) {
			errors.push('Cookie name is required');
		} else if (formData.name.includes(' ')) {
			errors.push('Cookie name cannot contain spaces');
		}

		// Domain validation
		if (!formData.domain?.trim()) {
			errors.push('Domain is required');
		} else if (!isValidDomain(formData.domain)) {
			errors.push('Invalid domain format');
		}

		// Path validation
		if (!formData.path?.trim()) {
			errors.push('Path is required');
		} else if (!formData.path.startsWith('/')) {
			errors.push('Path must start with /');
		}

		// SameSite + Secure validation
		if (formData.sameSite === 'None' && !formData.secure) {
			warnings.push('SameSite=None requires Secure flag');
		}

		// Expiration validation
		if (expiresDate && maxAgeValue) {
			warnings.push('Both expires and max-age are set, max-age takes precedence');
		}

		// Session cookie validation
		if (!formData.session && !expiresDate && !maxAgeValue) {
			warnings.push('Non-session cookies should have expiration');
		}

		setValidation({
			valid: errors.length === 0,
			errors,
			warnings,
		});
	};

	const isValidDomain = (domain: string): boolean => {
		const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
		return domainRegex.test(domain);
	};

	const handleSave = (): void => {
		if (!validation.valid) return;

		const cookieData: Omit<Cookie, 'created' | 'lastAccessed'> = {
			name: formData.name!,
			value: formData.value || '',
			domain: formData.domain!,
			path: formData.path!,
			expires: formData.session ? undefined : expiresDate,
			maxAge: formData.session ? undefined : maxAgeValue ? parseInt(maxAgeValue, 10) : undefined,
			secure: formData.secure || false,
			httpOnly: formData.httpOnly || false,
			sameSite: formData.sameSite as 'Strict' | 'Lax' | 'None',
			priority: formData.priority,
			partitioned: formData.partitioned || false,
			hostOnly: formData.hostOnly || false,
			session: formData.session || false,
		};

		onSave(cookieData);
	};

	const handleExpiresToggle = (isSession: boolean): void => {
		setFormData(prev => ({ ...prev, session: isSession }));
		if (isSession) {
			setExpiresDate(undefined);
			setMaxAgeValue('');
		}
	};

	const renderValidationMessages = () => {
		if (validation.errors.length === 0 && validation.warnings.length === 0) {
			return null;
		}

		return (
			<div className='space-y-2'>
				{validation.errors.map((error, index) => (
					<div key={`error-${index}`} className='flex items-center gap-2 text-sm text-red-600'>
						<XIcon className='w-4 h-4' />
						{error}
					</div>
				))}
				{validation.warnings.map((warning, index) => (
					<div key={`warning-${index}`} className='flex items-center gap-2 text-sm text-yellow-600'>
						<AlertTriangleIcon className='w-4 h-4' />
						{warning}
					</div>
				))}
			</div>
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onCancel}>
			<DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>{cookie ? 'Edit Cookie' : 'Add New Cookie'}</DialogTitle>
					<DialogDescription>{cookie ? 'Modify the cookie properties below.' : 'Create a new cookie with the properties below.'}</DialogDescription>
				</DialogHeader>

				<div className='space-y-4'>
					{/* Basic Properties */}
					<div className='space-y-3'>
						<div className='grid grid-cols-2 gap-3'>
							<div className='space-y-2'>
								<Label htmlFor='name'>Name *</Label>
								<Input
									id='name'
									value={formData.name || ''}
									onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
									placeholder='cookie_name'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='domain'>Domain *</Label>
								<Input
									id='domain'
									value={formData.domain || ''}
									onChange={e => setFormData(prev => ({ ...prev, domain: e.target.value }))}
									placeholder='example.com'
								/>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='value'>Value</Label>
							<Textarea
								id='value'
								value={formData.value || ''}
								onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
								placeholder='Cookie value...'
								rows={2}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='path'>Path *</Label>
							<Input id='path' value={formData.path || '/'} onChange={e => setFormData(prev => ({ ...prev, path: e.target.value }))} placeholder='/' />
						</div>
					</div>

					<Separator />

					{/* Expiration Settings */}
					<div className='space-y-3'>
						<div className='flex items-center space-x-2'>
							<Switch id='session' checked={formData.session || false} onCheckedChange={handleExpiresToggle} />
							<Label htmlFor='session'>Session Cookie</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<InfoIcon className='w-4 h-4 text-muted-foreground' />
									</TooltipTrigger>
									<TooltipContent>Session cookies are deleted when the browser closes</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>

						{!formData.session && (
							<div className='space-y-3 pl-6 border-l-2 border-muted'>
								<div className='space-y-2'>
									<Label htmlFor='expires'>Expires (ISO Date)</Label>
									<Input
										id='expires'
										type='datetime-local'
										value={expiresDate ? expiresDate.toISOString().slice(0, 16) : ''}
										onChange={e => setExpiresDate(e.target.value ? new Date(e.target.value) : undefined)}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='maxAge'>Max-Age (seconds)</Label>
									<Input id='maxAge' type='number' value={maxAgeValue} onChange={e => setMaxAgeValue(e.target.value)} placeholder='3600' />
								</div>
							</div>
						)}
					</div>

					<Separator />

					{/* Security Settings */}
					<div className='space-y-3'>
						<h3 className='text-sm font-medium flex items-center gap-2'>
							<ShieldIcon className='w-4 h-4' />
							Security Settings
						</h3>

						<div className='space-y-3 pl-6'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-2'>
									<Switch id='secure' checked={formData.secure || false} onCheckedChange={checked => setFormData(prev => ({ ...prev, secure: checked }))} />
									<Label htmlFor='secure'>Secure</Label>
								</div>
								<Badge variant={formData.secure ? 'default' : 'secondary'} className='text-xs'>
									{formData.secure ? 'HTTPS Only' : 'HTTP/HTTPS'}
								</Badge>
							</div>

							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-2'>
									<Switch
										id='httpOnly'
										checked={formData.httpOnly || false}
										onCheckedChange={checked => setFormData(prev => ({ ...prev, httpOnly: checked }))}
									/>
									<Label htmlFor='httpOnly'>HttpOnly</Label>
								</div>
								<Badge variant={formData.httpOnly ? 'default' : 'secondary'} className='text-xs'>
									{formData.httpOnly ? 'Server Only' : 'JavaScript Access'}
								</Badge>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='sameSite'>SameSite</Label>
								<Select
									value={formData.sameSite || 'Lax'}
									onValueChange={value => setFormData(prev => ({ ...prev, sameSite: value as 'Strict' | 'Lax' | 'None' }))}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='Strict'>Strict</SelectItem>
										<SelectItem value='Lax'>Lax</SelectItem>
										<SelectItem value='None'>None</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<Separator />

					{/* Advanced Settings */}
					<div className='space-y-3'>
						<h3 className='text-sm font-medium'>Advanced Settings</h3>

						<div className='space-y-3 pl-6'>
							<div className='flex items-center space-x-2'>
								<Switch id='hostOnly' checked={formData.hostOnly || false} onCheckedChange={checked => setFormData(prev => ({ ...prev, hostOnly: checked }))} />
								<Label htmlFor='hostOnly'>Host Only</Label>
							</div>

							<div className='flex items-center space-x-2'>
								<Switch
									id='partitioned'
									checked={formData.partitioned || false}
									onCheckedChange={checked => setFormData(prev => ({ ...prev, partitioned: checked }))}
								/>
								<Label htmlFor='partitioned'>Partitioned</Label>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='priority'>Priority</Label>
								<Select
									value={formData.priority || ''}
									onValueChange={value => setFormData(prev => ({ ...prev, priority: value as 'Low' | 'Medium' | 'High' }))}>
									<SelectTrigger>
										<SelectValue placeholder='Select priority' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='Low'>Low</SelectItem>
										<SelectItem value='Medium'>Medium</SelectItem>
										<SelectItem value='High'>High</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Validation Messages */}
					{renderValidationMessages()}
				</div>

				<DialogFooter className='flex gap-2'>
					{onDelete && cookie && (
						<Button variant='destructive' onClick={onDelete} className='mr-auto'>
							Delete
						</Button>
					)}
					<Button variant='outline' onClick={onCancel}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={!validation.valid}>
						{cookie ? 'Update' : 'Create'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
