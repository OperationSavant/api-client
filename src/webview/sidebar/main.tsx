import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { store } from '@/store';
import { Provider } from 'react-redux';
import { ErrorFallback } from '@/components/custom/states/error-fallback';
import { LoadingFallback } from '@/components/custom/states/loading-fallback';
import '../../style.css';

const App = lazy(() => import('./App'));

const root = ReactDOM.createRoot(document.getElementById('sidebar-root') as HTMLElement);
root.render(
	<React.StrictMode>
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<Provider store={store}>
				<Suspense fallback={<LoadingFallback />}>
					<App />
				</Suspense>
			</Provider>
		</ErrorBoundary>
	</React.StrictMode>
);
