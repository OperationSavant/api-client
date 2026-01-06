// Only import types, not the full Monaco API

import { forwardRef, lazy, Suspense } from 'react';
import type { MonacoEditorHandle, MonacoEditorProps } from '@/shared/types/monaco';
import { LoadingFallback } from '../custom/states/loading-fallback';

// Lazy load the actual Monaco editor
const MonacoEditorImpl = lazy(() => import('./monaco-editor'));

interface LazyMonacoEditorProps extends MonacoEditorProps {
	loadingMessage?: string;
	loadingDescription?: string;
}

export const MonacoEditor = forwardRef<MonacoEditorHandle, LazyMonacoEditorProps>((props, ref) => {
	return (
		<Suspense fallback={<LoadingFallback message={props.loadingMessage} description={props.loadingDescription} />}>
			<MonacoEditorImpl {...props} ref={ref} />
		</Suspense>
	);
});
