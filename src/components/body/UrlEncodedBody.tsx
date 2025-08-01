import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, FileText } from 'lucide-react';
import { KeyValuePair } from '@/types/body';

interface UrlEncodedBodyProps {
	urlEncoded: KeyValuePair[];
	onChange: (urlEncoded: KeyValuePair[]) => void;
}

const UrlEncodedBody: React.FC<UrlEncodedBodyProps> = ({ urlEncoded, onChange }) => {
	const addField = () => {
		const newField: KeyValuePair = {
			key: '',
			value: '',
			enabled: true,
			description: '',
		};
		onChange([...urlEncoded, newField]);
	};

	const removeField = (index: number) => {
		const updated = urlEncoded.filter((_, i) => i !== index);
		onChange(updated);
	};

	const updateField = (index: number, updates: Partial<KeyValuePair>) => {
		const updated = urlEncoded.map((field, i) => (i === index ? { ...field, ...updates } : field));
		onChange(updated);
	};

	const bulkEdit = () => {
		const current = urlEncoded
			.filter(field => field.enabled && field.key)
			.map(field => `${field.key}=${field.value}`)
			.join('\n');

		const textarea = document.createElement('textarea');
		textarea.value = current;
		textarea.style.position = 'fixed';
		textarea.style.top = '0';
		textarea.style.left = '0';
		textarea.style.width = '100%';
		textarea.style.height = '200px';
		textarea.style.zIndex = '1000';
		textarea.style.background = 'white';
		textarea.style.border = '1px solid #ccc';
		textarea.style.padding = '10px';

		document.body.appendChild(textarea);
		textarea.focus();

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				document.body.removeChild(textarea);
				textarea.removeEventListener('keydown', handleKeyDown);
			} else if (e.key === 'Enter' && e.ctrlKey) {
				const lines = textarea.value.split('\n');
				const newFields: KeyValuePair[] = lines
					.filter(line => line.trim())
					.map(line => {
						const [key, ...valueParts] = line.split('=');
						return {
							key: key?.trim() || '',
							value: valueParts.join('=').trim() || '',
							enabled: true,
							description: '',
						};
					});

				onChange(newFields);
				document.body.removeChild(textarea);
				textarea.removeEventListener('keydown', handleKeyDown);
			}
		};

		textarea.addEventListener('keydown', handleKeyDown);
	};

	const preview = () => {
		const params = new URLSearchParams();
		urlEncoded
			.filter(field => field.enabled && field.key)
			.forEach(field => {
				params.append(field.key, field.value);
			});
		return params.toString();
	};

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<Label className='text-sm font-medium'>URL-Encoded Form Data</Label>
				<div className='flex gap-2'>
					<Button onClick={bulkEdit} size='sm' variant='outline' className='flex items-center gap-2'>
						<FileText className='w-4 h-4' />
						Bulk Edit
					</Button>
					<Button onClick={addField} size='sm' variant='outline' className='flex items-center gap-2'>
						<Plus className='w-4 h-4' />
						Add Field
					</Button>
				</div>
			</div>

			{urlEncoded.length === 0 ? (
				<div className='text-center py-8 text-muted-foreground'>
					<p>No form fields.</p>
					<p className='text-sm'>Click "Add Field" to start adding URL-encoded data.</p>
				</div>
			) : (
				<div className='space-y-3'>
					{urlEncoded.map((field, index) => (
						<div key={index} className='flex items-start gap-2 p-3 border rounded-lg'>
							<Checkbox checked={field.enabled} onCheckedChange={checked => updateField(index, { enabled: !!checked })} />

							<div className='flex-1 space-y-2'>
								<div className='grid grid-cols-2 gap-2'>
									<Input placeholder='Key' value={field.key} onChange={e => updateField(index, { key: e.target.value })} disabled={!field.enabled} />
									<Input placeholder='Value' value={field.value} onChange={e => updateField(index, { value: e.target.value })} disabled={!field.enabled} />
								</div>

								{field.description !== undefined && (
									<Input
										placeholder='Description (optional)'
										value={field.description}
										onChange={e => updateField(index, { description: e.target.value })}
										disabled={!field.enabled}
										className='text-sm text-muted-foreground'
									/>
								)}
							</div>

							<Button
								onClick={() => removeField(index)}
								size='sm'
								variant='ghost'
								className='text-destructive hover:text-destructive hover:bg-destructive/10 mt-1'>
								<Trash2 className='w-4 h-4' />
							</Button>
						</div>
					))}
				</div>
			)}

			{urlEncoded.length > 0 && (
				<div className='space-y-2'>
					<Label className='text-sm font-medium'>Preview:</Label>
					<Textarea value={preview()} readOnly placeholder='URL-encoded output will appear here...' className='font-mono text-sm bg-muted/50' rows={3} />
					<div className='text-xs text-muted-foreground'>
						<p>• Content-Type: application/x-www-form-urlencoded</p>
						<p>• Special characters will be automatically encoded</p>
						<p>• Use Ctrl+Enter in bulk edit to save changes</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default UrlEncodedBody;
