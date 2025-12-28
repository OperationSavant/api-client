import type * as monaco from 'monaco-editor';

export interface MonacoEditorHandle {
	format: () => Promise<string | undefined>;
	openSearch: () => Promise<void>;
	copyToClipboard: () => Promise<void>;
	getEditor: () => monaco.editor.IStandaloneCodeEditor | null;
}

export interface MonacoEditorProps {
	value: string;
	language: string;
	readOnly?: boolean;
	height?: string | number;
	wordWrap?: boolean;
	searchEnabled?: boolean;
	minimap?: boolean;
	lineNumbers?: boolean;
	formatOnMount?: boolean;
	onContentChange?: (value: string) => void;
	className?: string;
}
