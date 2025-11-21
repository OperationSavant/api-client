'use client';
import { ChevronDownIcon, Download, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import React from 'react';

interface ApiClientButtonGroupProps extends React.ComponentProps<typeof Button> {
	downloadClick?: () => void;
	buttonText?: string;
	loading?: boolean;
}

export const ApiClientButtonGroup = ({ onClick, disabled, size, downloadClick, loading, buttonText }: ApiClientButtonGroupProps) => {
	return (
		<ButtonGroup className='ring-0 focus:ring-0 border-muted-foreground hover:rounded-md text-xs w-full'>
			<Button
				variant='outline'
				size={size}
				onClick={onClick}
				disabled={disabled}
				className='border-muted-foreground text-xs font-medium hover:text-accent-foreground flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground!'>
				<div className='flex items-center gap-2'>
					{loading ? <Loader2 className='animate-spin h-4 w-4 hover:text-accent-foreground' /> : <Send className='h-4 w-4 hover:text-accent-foreground' />}
					<span>{buttonText}</span>
				</div>
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant='outline'
						size={size}
						className='pl-2! outline-0 ring-0 focus:ring-0 border-muted-foreground text-xs font-medium shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground!'>
						<ChevronDownIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='p-0! border-none! shadow-none!'>
					<DropdownMenuGroup>
						<DropdownMenuItem className='p-0! border-none! shadow-none!'>
							<Button
								variant='outline'
								size={size}
								onClick={downloadClick}
								disabled={disabled}
								className='border-muted-foreground text-xs font-medium hover:text-accent-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground!'>
								<div className='flex items-center gap-2'>
									<Download className='h-4 w-4 hover:text-accent-foreground' />
									<span>Send and Download</span>
								</div>
							</Button>
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	);
};
