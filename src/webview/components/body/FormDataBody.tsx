import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Upload } from 'lucide-react';
import { FormDataBody } from '@/shared/types/body';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ApiClientSelect } from '../custom/api-client-select';
import { cn } from '@/shared/lib/utils';
import { useKeyValueTable } from '@/hooks/useKeyValueTable';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/main-store';
import { FORM_DATA_FIELD_TYPE_OPTIONS } from '@/shared/constants/select-options';
import { setFormData } from '@/features/request/requestSlice';

interface FormDataBodyProps {
	onSelectFile: (index: number) => void;
}

const defaultRow: FormDataBody = { key: '', value: '', checked: false, type: 'text' };

const FormDataBody: React.FC<FormDataBodyProps> = ({ onSelectFile }) => {
	const dispatch = useDispatch();
	const body = useSelector((state: RootState) => state.request.body);
	const formData = body.type === 'form-data' ? body.formData : [];
	const { updateRow, handleDelete } = useKeyValueTable<FormDataBody>(formData, newFormData => dispatch(setFormData(newFormData)), defaultRow);

	return (
		<Table className='text-xs border border-muted-foreground table-fixed'>
			<TableHeader>
				<TableRow className='border-b border-muted-foreground'>
					<TableHead className='border-r border-muted-foreground w-8 text-center p-0 align-middle' />
					<TableHead className='border-r border-muted-foreground w-1/2'>Key</TableHead>
					<TableHead className='w-1/2'>Value</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{formData.map((param, idx) => {
					const isEmpty = param.key === '' && param.value === '';
					return (
						<TableRow key={idx} className='group border-b border-muted-foreground'>
							<TableCell className='border-r border-muted-foreground w-8 text-center p-0 align-middle'>
								<div className='flex items-center justify-center h-full'>
									<Checkbox
										checked={!!param.checked}
										disabled={isEmpty}
										onCheckedChange={checked => {
											if (!isEmpty) updateRow(idx, { checked: !!checked });
										}}
									/>
								</div>
							</TableCell>
							<TableCell className='border-r border-muted-foreground p-0'>
								<div className='flex'>
									<Input
										className='w-full h-10 font-medium border-none focus:ring-0 focus:border-none rounded-none bg-transparent px-2 text-xs!'
										placeholder='Key'
										value={param.key}
										onChange={e => updateRow(idx, { key: e.target.value })}
										disabled={false}
									/>
									<ApiClientSelect
										classNameTrigger='w-[200px] text-xs!'
										onValueChange={(value: 'text' | 'file') => updateRow(idx, { type: value, value: '' })}
										options={FORM_DATA_FIELD_TYPE_OPTIONS}
										value={param.type}
									/>
								</div>
							</TableCell>
							<TableCell className='relative p-0 h-full'>
								{param.type === 'text' ? (
									<Input
										className='w-full h-10 font-medium border-none focus:ring-0 focus:border-none rounded-none bg-transparent px-2 text-xs!'
										placeholder='Value'
										value={param.value}
										onChange={e => updateRow(idx, { value: e.target.value })}
									/>
								) : (
									<Button
										variant='outline'
										size='lg'
										className={cn(
											`w-1/3 h-10 justify-start border-none focus:ring-0 focus:border-none gap-2 font-medium text-xs truncate`,
											param.fileName ? 'hover:bg-transparent text-foreground!' : ''
										)}
										onClick={e => onSelectFile(idx)}>
										<Upload />
										<span className='truncate'>{param.fileName || 'Choose File'}</span>
									</Button>
								)}
								{!isEmpty && param.value && (
									<Button
										variant='ghost'
										size='icon'
										className='absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted-foreground/20 hover:text-destructive text-xs'
										onClick={() => handleDelete(idx)}
										tabIndex={-1}>
										<Trash2 className='w-4 h-4' />
									</Button>
								)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};

export default FormDataBody;
