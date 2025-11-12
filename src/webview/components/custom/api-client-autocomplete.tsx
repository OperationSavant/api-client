'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AutocompleteProps {
	options: Record<'value' | 'label', string>[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export const Autocomplete = ({ options, value, onChange, placeholder }: AutocompleteProps) => {
	const [open, setOpen] = React.useState(false);
	const [inputValue, setInputValue] = React.useState(value);

	React.useEffect(() => {
		setInputValue(value);
	}, [value]);

	const handleSelect = (selected: string) => {
		setInputValue(selected);
		onChange(selected);
		setOpen(false);
	};

	const handleInputChange = (val: string) => {
		setInputValue(val);
		onChange(val);
	};

	return (
		<div className='flex w-full'>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						role='combobox'
						aria-expanded={open}
						className='border-0 hover:bg-transparent focus:bg-transparent w-full h-10 px-2 text-xs font-medium border-none bg-transparent rounded-none justify-between outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 flex items-center'>
						{inputValue || placeholder || '\u00A0'}
						<ChevronsUpDown className='opacity-50 ml-2' />
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-full p-0 text-xs' align='start'>
					<Command>
						<CommandInput placeholder={placeholder} className='h-10 text-xs' value={inputValue} onValueChange={handleInputChange} />
						<CommandList>
							<CommandGroup>
								{options.map(option => (
									<CommandItem key={option.value} value={option.value} onSelect={handleSelect} className='text-xs'>
										{option.label}
										<Check className={cn('ml-auto', inputValue === option.value ? 'opacity-100' : 'opacity-0')} />
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
};
