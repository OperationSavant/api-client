import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { EmptyState as _EmptyState } from './empty-state';

interface ErrorFallbackProps {
	error: Error;
	resetErrorBoundary: () => void;
}

/**
 * ErrorFallback
 *
 * Usage:
 * - MUST be used only as a React Error Boundary fallback.
 * - Represents unrecoverable application-boundary failures
 *   (startup crash, render failure, invariant violation).
 *
 * MUST NOT be used for:
 * - Application functionality errors
 *   (HTTP 4xx / 5xx, network failures, auth errors).
 *   Use {@link _EmptyState | EmptyState} instead.
 *
 * Behavior:
 * - Does not render internal error details.
 * - Provides recovery actions appropriate for boundary failures only.
 *
 * @param error Captured boundary error (telemetry only).
 * @param resetErrorBoundary Resets the error boundary and retries rendering.
 */
export function ErrorFallback({ error: _error, resetErrorBoundary }: ErrorFallbackProps) {
	return (
		<div className='flex h-full min-h-full items-center justify-center bg-background text-foreground p-4'>
			<Empty className='max-w-md border-none'>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<AlertTriangle className='size-6 text-destructive' />
					</EmptyMedia>

					<EmptyTitle>Something went wrong</EmptyTitle>

					<EmptyDescription>
						{`The application encountered an unexpected problem and couldn't continue. Please restart the UI. If the problem persists after retrying, you can report the issue on GitHub.`}
					</EmptyDescription>
				</EmptyHeader>

				<EmptyContent>
					<div className='flex gap-2'>
						<Button variant='default' onClick={resetErrorBoundary}>
							Restart UI
						</Button>

						<Button
							variant='outline'
							onClick={() => {
								// Intent only — extension host owns the action
								//TODO: telemetry can be added here and actual call needs to be done
								// vscode.postMessage({ type: 'INTENT_REPORT_CRASH' });
							}}>
							Report issue if it persists
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	);
}
