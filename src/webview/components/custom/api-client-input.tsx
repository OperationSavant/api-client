import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/lib/utils';

interface ApiClientInputProps extends React.ComponentProps<typeof Input> {
	error?: boolean;
}

/**
 * VS Code UX-compliant input wrapper.
 * - Minimal border-radius (1px)
 * - No shadows
 * - 1px focus outline (not ring)
 * - Uses VS Code theme tokens
 */
const ApiClientInput = React.forwardRef<HTMLInputElement, ApiClientInputProps>(({ className, error, ...props }, ref) => {
	const vscodeBaseStyles = [
		// Reset Shadcn defaults
		'rounded-[1px]',
		'shadow-none',
		'ring-0',
		'ring-offset-0',

		// VS Code styling
		'bg-input-background',
		'text-input-foreground',
		'border',
		'border-input-border',
		'placeholder:text-input-placeholder',

		// VS Code focus style
		'focus-visible:ring-0',
		'focus-visible:ring-offset-0',
		'focus-visible:outline',
		'focus-visible:outline-1',
		'focus-visible:outline-offset-0',
		'focus-visible:outline-focus-border',

		// Disabled state
		'disabled:opacity-50',
		'disabled:cursor-not-allowed',
	].join(' ');

	const errorStyles = error ? 'border-validation-error-border outline-validation-error-border' : '';

	return <Input ref={ref} className={cn(vscodeBaseStyles, errorStyles, className)} {...props} />;
});

ApiClientInput.displayName = 'ApiClientInput';

export { ApiClientInput };
