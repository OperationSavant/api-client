import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { colord, extend } from 'colord';
import a11y from 'colord/plugins/a11y';

extend([a11y]);

/**
 * Reads a VS Code theme CSS variable from the document body.
 * @param varName The name of the CSS variable (e.g., '--vscode-editor-background')
 * @returns The computed color value (e.g., '#1E1E1E')
 */
const getThemeColor = (varName: string): string | null => {
	const color = getComputedStyle(document.body).getPropertyValue(varName).trim();
	return color || null;
};

/**
 * Defines a custom Monaco theme that dynamically uses the VS Code
 * theme's CSS variables for both UI chrome and syntax token colors.
 */
export function defineVscodeTheme(tokenColorRules: any[]) {
	const bodyClass = document.body.classList;
	let baseTheme: 'vs' | 'vs-dark' | 'hc-black' = 'vs-dark';
	if (bodyClass.contains('vscode-light')) {
		baseTheme = 'vs';
	} else if (bodyClass.contains('vscode-high-contrast')) {
		baseTheme = 'hc-black';
	}

	const rules: monaco.editor.ITokenThemeRule[] = [];
	for (const rule of tokenColorRules) {
		const foreground = rule.settings?.foreground;
		if (!rule.scope || !foreground) {
			continue;
		}
		const color = colord(foreground);
		if (color.isValid()) {
			const hex = color.toHex().substring(1);
			const token = Array.isArray(rule.scope) ? rule.scope.join(' ') : rule.scope;
			rules.push({ token, foreground: hex, fontStyle: rule.settings.fontStyle });
		}
	}

	const colors: monaco.editor.IColors = {};
	const colorMappings = {
		'editor.background': '--vscode-editor-background',
		'editor.foreground': '--vscode-editor-foreground',
		'editorCursor.foreground': '--vscode-editorCursor-foreground',
		'editor.selectionBackground': '--vscode-editor-selectionBackground',
		'editor.selectionHighlightBackground': '--vscode-editor-selectionHighlightBackground',
		'editorWhitespace.foreground': '--vscode-editorWhitespace-foreground',
		'editorLineNumber.foreground': '--vscode-editorLineNumber-foreground',
	};

	for (const [monacoKey, vscodeVar] of Object.entries(colorMappings)) {
		const colorValue = getThemeColor(vscodeVar);
		if (colorValue) {
			colors[monacoKey] = colorValue;
		}
	}

	// The magic happens here: we read the live CSS variables
	// and pass the resolved hex codes to Monaco.
	monaco.editor.defineTheme('vscode-theme', {
		base: baseTheme,
		inherit: true,
		rules,
		colors,
	});
}

export const getVariableTypeColor = (type: 'secret' | 'text'): string => {
	return type === 'secret' ? 'bg-destructive/10 text-destructive border-border' : 'bg-accent text-accent-foreground border-border';
};

export const getScopeColor = (scope: 'global' | 'collection' | 'request'): string => {
	const colors = {
		global: 'bg-primary text-primary-foreground border-border',
		collection: 'bg-secondary text-secondary-foreground border-border',
		request: 'bg-accent text-accent-foreground border-border',
	};
	return colors[scope] || 'bg-muted text-muted-foreground border-border';
};
