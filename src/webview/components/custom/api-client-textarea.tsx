import React from 'react';
import { Textarea } from '../ui/textarea';
import { cn } from '@/shared/lib/utils';

interface ApiClientTextareaProps extends React.ComponentProps<typeof Textarea> {
	className?: string;
	error?: boolean;
}

// VS Code compliant base styles
const vscodeTextareaStyles = [
	'rounded-[1px]',
	'shadow-none',
	'ring-0',
	'ring-offset-0',
	'bg-input-background',
	'text-input-foreground',
	'border',
	'border-input-border',
	'placeholder:text-input-placeholder',
	'focus-visible:ring-0',
	'focus-visible:ring-offset-0',
	'focus-visible:outline',
	'focus-visible:outline-1',
	'focus-visible:outline-offset-0',
	'focus-visible:outline-focus-border',
	'disabled:opacity-50',
	'disabled:cursor-not-allowed',
	'field-sizing-fixed',
	'[scrollbar-gutter:stable]',
	'pr-1',
].join(' ');

export const ApiClientTextarea: React.FC<ApiClientTextareaProps> = ({ className, error, ...props }) => {
	const errorStyles = error ? 'border-validation-error-border outline-validation-error-border' : '';

	return <Textarea className={cn(vscodeTextareaStyles, errorStyles, className)} {...props} />;
};
