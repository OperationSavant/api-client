import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/components/custom/states/error-fallback';
import { LoadingFallback } from '@/components/custom/states/loading-fallback';

const App = lazy(() => import('./App'));

const root = ReactDOM.createRoot(document.getElementById('secondary-root') as HTMLElement);
root.render(
	<React.StrictMode>
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<Suspense fallback={<LoadingFallback />}>
				<App />
			</Suspense>
		</ErrorBoundary>
	</React.StrictMode>
);
