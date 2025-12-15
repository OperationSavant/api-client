import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { mainStore } from '@/store/main-store';
import { Provider } from 'react-redux';
import { ErrorFallback } from '@/components/custom/states/error-fallback';
import { LoadingFallback } from '@/components/custom/states/loading-fallback';
import '../../styles/style.css';
import { pdfjs } from 'react-pdf';

const App = lazy(() => import('./App'));
pdfjs.GlobalWorkerOptions.workerSrc = './build/pdf.worker.min.mjs';

const root = ReactDOM.createRoot(document.getElementById('main-root') as HTMLElement);
root.render(
	<React.StrictMode>
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<Provider store={mainStore}>
				<Suspense fallback={<LoadingFallback />}>
					<App />
				</Suspense>
			</Provider>
		</ErrorBoundary>
	</React.StrictMode>
);

