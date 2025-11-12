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
}

const ApiClientFieldRow = ({ label, htmlFor, optional, showLabel = true, optionalText, className, children }: ApiClientFieldRowProps) => {
	return (
		<div className={cn(`flex flex-row items-center gap-4`, className)}>
			{showLabel && (
				<div className={`flex ${optional ? 'flex-col' : 'flex-wrap'} w-1/5`}>
					<Label htmlFor={htmlFor}>{label}</Label>
					{optional && <span className='text-muted-foreground text-xs italic'>{optionalText}</span>}
				</div>
			)}
			<div className={cn('flex w-4/5 relative', className)}>{children}</div>
		</div>
	);
};

export default ApiClientFieldRow;
