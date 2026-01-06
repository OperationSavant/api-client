import React from 'react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface LoadingFallbackProps {
	message?: string;
	description?: string;
	className?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message, description, className }) => {
	return (
		<div className={cn(`flex items-center justify-center h-screen bg-transparent text-foreground`, className)}>
			{message && (
				<Empty className='border-none'>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<Loader2 className='size-6 animate-spin text-primary' />
						</EmptyMedia>
						<EmptyTitle>{message}</EmptyTitle>
						{description && <EmptyDescription>{description}</EmptyDescription>}
					</EmptyHeader>
				</Empty>
			)}
		</div>
	);
};
