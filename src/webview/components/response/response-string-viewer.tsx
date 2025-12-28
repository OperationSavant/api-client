import { MonacoEditor } from '@/components/editor/lazy-monaco-editor';
import type { MonacoEditorHandle } from '@/shared/types/monaco';
import { forwardRef } from 'react';

interface ResponseStringViewerProps {
	value: string;
	language: string;
	wordWrap: boolean;
	searchEnabled?: boolean;
	formatOnMount?: boolean;
}

const ResponseStringViewer = forwardRef<MonacoEditorHandle, ResponseStringViewerProps>(({ value, language, wordWrap, searchEnabled, formatOnMount }, ref) => {
	return (
		<MonacoEditor
			ref={ref}
			value={value}
			language={language}
			wordWrap={wordWrap}
			searchEnabled={searchEnabled}
			formatOnMount={formatOnMount}
			readOnly={true}
			height='100%'
		/>
	);
});
export default ResponseStringViewer;
