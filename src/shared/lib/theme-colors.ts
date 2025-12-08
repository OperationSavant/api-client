import { colord, extend } from 'colord';
import a11y from 'colord/plugins/a11y';

extend([a11y]);

interface VsCodeThemeProps {
	tokenColors: any;
	themeColors: any;
	monaco: any;
}

/**
 * Defines a custom Monaco theme that dynamically uses the VS Code
 * theme's CSS variables for both UI chrome and syntax token colors.
 */
export function defineVscodeTheme({ tokenColors, themeColors, monaco }: VsCodeThemeProps) {
	const bodyClass = document.body.classList;
	let baseTheme: 'vs' | 'vs-dark' | 'hc-black' = 'vs-dark';
	if (bodyClass.contains('vscode-light')) {
		baseTheme = 'vs';
	} else if (bodyClass.contains('vscode-high-contrast')) {
		baseTheme = 'hc-black';
	}

	const rules = [];
	for (const rule of tokenColors) {
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

	const colors = themeColors || {};
	monaco.editor.defineTheme('vscode-theme', {
		base: baseTheme,
		inherit: true,
		rules,
		colors,
	});
}
