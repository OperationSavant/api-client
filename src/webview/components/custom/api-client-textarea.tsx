import React from 'react';
import { Textarea } from '../ui/textarea';
import { cn } from '@/shared/lib/utils';

interface ApiClientTextareaProps extends React.ComponentProps<typeof Textarea> {
	className?: string;
}

export const ApiClientTextarea: React.FC<ApiClientTextareaProps> = ({ className, ...props }) => {
	return (
		<Textarea
			className={cn(
				`border-muted-foreground! focus-visible:ring-0! focus-visible:ring-offset-0! focus-visible:border-muted-foreground! field-sizing-fixed [scrollbar-gutter:stable] pr-1`,
				className
			)}
			{...props}
		/>
	);
};
