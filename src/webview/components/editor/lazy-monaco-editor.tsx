// Only import types, not the full Monaco API

import { forwardRef, lazy, Suspense } from 'react';
import { MonacoEditorHandle, MonacoEditorProps } from '@/shared/types/monaco';
import { LoadingFallback } from '../custom/states/loading-fallback';

// Lazy load the actual Monaco editor
const MonacoEditorImpl = lazy(() => import('./monaco-editor'));

export const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>((props, ref) => {
	return (
		<Suspense fallback={<LoadingFallback message='Loading Request Body Editor' />}>
			<MonacoEditorImpl {...props} ref={ref} />
		</Suspense>
	);
});
