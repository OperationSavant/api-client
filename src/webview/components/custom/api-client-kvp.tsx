import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { KeyValueEntry } from '@/shared/types/request';
import { Autocomplete } from './api-client-autocomplete';
import { COMMON_HEADER_NAMES } from '@/shared/constants/headers';
import { HEADER_DEFAULT_VALUES } from '@/shared/constants/header-default-values';

interface ApiClientTableProps<T extends KeyValueEntry> {
	rows: T[];
	handleChange?: (idx: number, field: keyof T, val: string) => void;
	handleCheck?: (idx: number, checked: boolean) => void;
	handleDelete?: (idx: number) => void;
	isHeaderTable?: boolean;
	isReadOnly?: boolean;
}

export const ApiClientTable = ({ rows, handleChange, handleCheck, handleDelete, isHeaderTable, isReadOnly }: ApiClientTableProps<KeyValueEntry>) => {
	return (
		<div className='flex'>
			<Table className='text-xs border border-muted-foreground table-fixed'>
				<TableHeader>
					<TableRow className='border-b border-muted-foreground sticky top-0'>
						{!isReadOnly && <TableHead className='border-r border-muted-foreground w-8 text-center p-0 align-middle' />}
						<TableHead className='border-r border-muted-foreground w-1/2'>Key</TableHead>
						<TableHead className='w-1/2'>Value</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((param, idx) => {
						const isEmpty = param.key === '' && param.value === '';
						return (
							<TableRow key={idx} className='group border-b border-muted-foreground justify'>
								{!isReadOnly && (
									<TableCell className='border-r border-muted-foreground w-8 text-center p-0 align-middle'>
										<div className='flex items-center justify-center h-full'>
											<Checkbox
												checked={!!param.checked}
												disabled={isEmpty}
												onCheckedChange={checked => {
													if (!isEmpty) handleCheck ? handleCheck(idx, !!checked) : undefined;
												}}
											/>
										</div>
									</TableCell>
								)}
								<TableCell className='border-r border-muted-foreground p-0'>
									{isHeaderTable ? (
										<Autocomplete
											options={COMMON_HEADER_NAMES}
											value={param.key}
											onChange={val => (handleChange ? handleChange(idx, 'key', val) : undefined)}
											placeholder=''
										/>
									) : !isReadOnly ? (
										<Input
											className='w-full h-10 font-medium border-none focus:ring-0 focus:border-none rounded-none bg-transparent px-2 text-xs!'
											placeholder='Key'
											value={param.key}
											onChange={e => (handleChange ? handleChange(idx, 'key', e.target.value) : undefined)}
											disabled={false}
										/>
									) : (
										<div className='w-full min-h-10 font-medium border-none focus:ring-0 focus:border-none rounded-none bg-transparent px-2 text-xs! flex-wrap flex items-center text-wrap'>
											{param.key}
										</div>
									)}
								</TableCell>
								<TableCell className='relative p-0'>
									{isHeaderTable ? (
										<Autocomplete
											options={HEADER_DEFAULT_VALUES[param.key] ? HEADER_DEFAULT_VALUES[param.key] : []}
											value={param.value}
											onChange={val => (handleChange ? handleChange(idx, 'value', val) : undefined)}
											placeholder=''
										/>
									) : !isReadOnly ? (
										<Input
											className='w-full h-10 font-medium border-none focus:ring-0 focus:border-none rounded-none bg-transparent px-2 text-xs!'
											placeholder='Value'
											value={param.value}
											onChange={e => (handleChange ? handleChange(idx, 'value', e.target.value) : undefined)}
											disabled={false}
										/>
									) : (
										<div className='w-full min-h-10 font-medium border-none focus:ring-0 focus:border-none rounded-none bg-transparent px-2 text-xs! flex-wrap flex items-center text-wrap'>
											{param.value}
										</div>
									)}
									{!isEmpty && param.value && !isReadOnly && (
										<Button
											variant='ghost'
											size='icon'
											className='absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted-foreground/20 hover:text-destructive text-xs'
											onClick={() => (handleDelete ? handleDelete(idx) : undefined)}
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
		</div>
	);
};
