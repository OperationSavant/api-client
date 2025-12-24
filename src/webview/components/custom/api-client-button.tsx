import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface ApiClientButtonProps extends React.ComponentProps<typeof Button> {
	className?: string;
}

/**
 * VS Code UX-compliant button wrapper.
 * Keeps Shadcn's variant/size props but overrides styling to match VS Code design language:
 * - Minimal border-radius (1px)
 * - No shadows
 * - 1px focus outline (not ring)
 * - VS Code UX-compliant button wrapper.
 * - Uses mapped Tailwind theme tokens from style.css
 */
const ApiClientButton = ({ className, variant, size, ...props }: ApiClientButtonProps) => {
	// VS Code compliant base styles (overrides Shadcn defaults)
	const vscodeBaseStyles = [
		// Reset Shadcn defaults
		'rounded-[1px]',
		'shadow-none',
		'ring-0',
		'ring-offset-0',

		// VS Code focus style
		'focus-visible:ring-0',
		'focus-visible:ring-offset-0',
		'focus-visible:outline',
		'focus-visible:outline-1',
		'focus-visible:outline-offset-1',
		'focus-visible:outline-focus-border',
	].join(' ');

	// Variant-specific overrides using mapped Tailwind theme tokens
	const variantOverrides: Record<string, string> = {
		default: ['bg-button', 'text-button-foreground', 'hover:bg-button-hover'].join(' '),

		secondary: ['bg-button-secondary', 'text-button-secondary-foreground', 'hover:bg-button-secondary-hover'].join(' '),

		destructive: ['bg-destructive', 'text-destructive-foreground', 'hover:opacity-90'].join(' '),

		outline: ['bg-transparent', 'text-foreground', 'border', 'border-border', 'hover:bg-accent'].join(' '),

		ghost: ['bg-transparent', 'text-foreground', 'hover:bg-toolbar-hover'].join(' '),

		link: ['bg-transparent', 'text-link', 'hover:text-link-active', 'hover:underline', 'p-0', 'h-auto'].join(' '),
	};

	const currentVariant = variant || 'default';
	const variantStyle = variantOverrides[currentVariant] || variantOverrides.default;

	return (
		<Button variant={variant} size={size} className={cn(vscodeBaseStyles, variantStyle, className)} {...props}>
			{props.children}
			{props.content}
		</Button>
	);
};

export default ApiClientButton;
