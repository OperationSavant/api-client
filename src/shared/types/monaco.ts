import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export interface MonacoEditorHandle {
	format: () => Promise<string | undefined>;
	getEditor: () => monaco.editor.IStandaloneCodeEditor | null;
}

export interface MonacoEditorProps {
	value: string;
	language: string;
	readOnly?: boolean;
	height?: string | number;
	wordWrap?: boolean;
	minimap?: boolean;
	lineNumbers?: boolean;
	copyButtonVisible?: boolean;
	formatOnMount?: boolean;
	onContentChange?: (value: string) => void;
	className?: string;
}
