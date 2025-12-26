import { defineVscodeTheme } from '@/shared/lib/theme-colors';

export function createThemeHandlers() {
	const handleThemeData = async (message: any) => {
		// Dynamically import Monaco only if it's being used
		// This prevents Monaco from bundling in the main chunk
		try {
			const monaco = await import('monaco-editor/esm/vs/editor/editor.api');
			defineVscodeTheme({
				tokenColors: message.themeContent.tokenColors,
				themeColors: message.themeContent.colors,
				monaco,
				themeType: message.themeContent.type,
			});
			// monaco.editor.setTheme('vscode-theme');
		} catch (error) {
			// Monaco not loaded yet or not needed - theme will apply when Monaco loads
			console.debug('Monaco not available for theme application:', error);
		}
	};

	return {
		handleThemeData,
	};
}
