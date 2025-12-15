import { MonacoEditor } from '@/components/editor/lazy-monaco-editor';

interface ResponseStringViewerProps {
	value: string;
	language: string;
	wordWrap: boolean;
	formatOnMount?: boolean;
	copyButtonVisible?: boolean;
}

const ResponseStringViewer: React.FC<ResponseStringViewerProps> = ({ value, language, wordWrap, formatOnMount, copyButtonVisible }) => {
	return (
		<MonacoEditor
			value={value}
			language={language}
			formatOnMount={formatOnMount}
			wordWrap={wordWrap}
			height='100%'
			copyButtonVisible={copyButtonVisible}
			readOnly={true}
		/>
	);
};

export default ResponseStringViewer;
