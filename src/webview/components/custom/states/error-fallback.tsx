import React from 'react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
	error: Error;
	resetErrorBoundary: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
	return (
		<div className='flex items-center justify-center h-screen bg-background text-foreground p-4'>
			<Empty className='max-w-md border-none'>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<AlertTriangle className='size-6 text-destructive' />
					</EmptyMedia>
					<EmptyTitle>Something went wrong</EmptyTitle>
					<EmptyDescription>
						An unexpected error occurred while rendering the application. Please try reloading or contact support if the problem persists.
					</EmptyDescription>
				</EmptyHeader>

				<EmptyContent>
					<div className='w-full rounded-md bg-muted p-3 text-left'>
						<code className='text-xs text-muted-foreground break-all'>{error.message}</code>
					</div>

					<div className='flex gap-2'>
						<Button onClick={resetErrorBoundary} variant='default'>
							Try Again
						</Button>
						<Button onClick={() => window.location.reload()} variant='outline'>
							Reload Extension
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	);
};
