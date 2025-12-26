'use client';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import type { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import React from 'react';
import { cn } from '@/shared/lib/utils';
import ApiClientButton from './api-client-button';

interface Action {
	label?: string;
	icon?: LucideIcon;
	onClick?: () => void;
}
interface ApiClientButtonGroupProps extends React.ComponentProps<typeof Button> {
	label?: string;
	loading?: boolean;
	icon?: LucideIcon;
	actions?: Action[];
}

export const ApiClientButtonGroup = ({ onClick, size, actions, label, icon: Icon }: ApiClientButtonGroupProps) => {
	return (
		<div className='inline-flex w-full'>
			<ApiClientButton onClick={onClick} size={size} className={cn('flex-1 px-1 sm:px-2 md:px-3 text-sm rounded-none rounded-l-[1px]')}>
				{Icon && <Icon className='w-4 h-4 mr-2 shrink-0' />}
				<span className='text-xs'>{label}</span>
			</ApiClientButton>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<ApiClientButton
						className={cn(
							'flex items-center justify-center rounded-none rounded-r-[1px] border-l border-button-separator',
							'has-[>svg]:px-2 sm:has-[>svg]:px-4'
						)}
						aria-label='More actions'
						size={size}>
						<ChevronDown className='h-4 w-4' />
					</ApiClientButton>
				</DropdownMenuTrigger>

				<DropdownMenuContent className={cn(`bg-menu text-menu-foreground border border-menu-border rounded-[1px] shadow-none`)} align='end'>
					{actions?.map(a => (
						<DropdownMenuItem key={a.label} onClick={a.onClick} className={cn('rounded-[1px] cursor-pointer hover:bg-menu-selection focus:bg-menu-selection')}>
							{a.icon && <a.icon className='w-4 h-4 mr-2 shrink-0' />}
							{a.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
