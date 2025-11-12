import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export interface MonacoEditorHandle {
	format: () => Promise<string | undefined>;
	getEditor: () => monaco.editor.IStandaloneCodeEditor | null;
}
