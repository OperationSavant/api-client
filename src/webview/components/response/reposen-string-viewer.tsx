import React, { lazy, Suspense } from 'react';
import { LoadingFallback } from '../custom/states/loading-fallback';

const MonacoEditor = lazy(() => import('@/components/editor/monaco-editor'));

interface ResponseStringViewerProps {
	value: string;
	language: string;
	wordWrap: boolean;
	formatOnMount?: boolean;
	copyButtonVisible?: boolean;
}

const ResponseStringViewer: React.FC<ResponseStringViewerProps> = ({ value, language, wordWrap, formatOnMount, copyButtonVisible }) => {
	return (
		<Suspense fallback={<LoadingFallback />}>
			<MonacoEditor
				value={value}
				language={language}
				formatOnMount={formatOnMount}
				wordWrap={wordWrap}
				height='100%'
				copyButtonVisible={copyButtonVisible}
				readOnly={true}
			/>
		</Suspense>
	);
};

export default ResponseStringViewer;
