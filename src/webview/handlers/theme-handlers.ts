import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { defineVscodeTheme } from '@/shared/lib/theme-colors';

export function createThemeHandlers() {
	const handleThemeData = (message: any) => {
		defineVscodeTheme(message.tokenColors);
		monaco.editor.setTheme('vscode-theme');
	};

	return {
		handleThemeData,
	};
}
