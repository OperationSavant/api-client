import React from 'react';
import { Label } from '../ui/label';
import { cn } from '@/shared/lib/utils';

interface ApiClientFieldRowProps {
	label?: string;
	htmlFor?: string;
	showLabel?: boolean;
	optional?: boolean;
	optionalText?: string;
	className?: string;
	children: React.ReactNode;
	colMode?: boolean;
}

const ApiClientFieldRow = ({ label, htmlFor, optional, showLabel = true, optionalText, className, children, colMode = false }: ApiClientFieldRowProps) => {
	return (
		<div className={cn(`flex flex-row items-center gap-4`, className)}>
			{showLabel && (
				<div className={`flex ${optional ? 'flex-col' : 'flex-wrap'} ${colMode ? 'w-full' : 'w-1/5'}`}>
					<Label htmlFor={htmlFor} className={className}>
						{label}
					</Label>
					{optional && <span className='text-muted-foreground text-xs italic'>{optionalText}</span>}
				</div>
			)}
			<div className={cn('flex relative', className, colMode ? 'w-full' : 'w-4/5')}>{children}</div>
		</div>
	);
};

export default ApiClientFieldRow;
