import React from 'react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
	message?: string;
	description?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
	message = 'Loading API Client...',
	description = 'Please wait while we prepare your workspace',
}) => {
	return (
		<div className='flex items-center justify-center h-screen bg-background text-foreground'>
			<Empty className='border-none'>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<Loader2 className='size-6 animate-spin text-primary' />
					</EmptyMedia>
					<EmptyTitle>{message}</EmptyTitle>
					{description && <EmptyDescription>{description}</EmptyDescription>}
				</EmptyHeader>
			</Empty>
		</div>
	);
};
