import React from 'react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { cn } from '@/shared/lib/utils';
import { CircleAlert } from 'lucide-react';

interface ErrorStateProps {
	title: string;
	errorDescription?: string;
	errorContent?: string | React.ReactNode;
	className?: string;
}

/**
 * Reusable error state component
 * Use this for "error" scenarios throughout the application
 */
export const ErrorState: React.FC<ErrorStateProps> = ({ title, errorDescription, errorContent, className }) => {
	return (
		<Empty className={cn('border-none', className)}>
			<EmptyHeader>
				<EmptyMedia variant='icon'>
					<CircleAlert className='size-6 text-destructive' />
				</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				{errorDescription && <EmptyDescription>{errorDescription}</EmptyDescription>}
				{errorContent && <EmptyContent>{errorContent}</EmptyContent>}
			</EmptyHeader>
		</Empty>
	);
};
