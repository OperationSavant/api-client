import { colord, extend } from 'colord';
import a11y from 'colord/plugins/a11y';

extend([a11y]);

interface VsCodeThemeProps {
	tokenColors: any;
	themeColors: any;
	monaco: any;
	themeType?: 'dark' | 'light' | 'hc-black';
}

/**
 * Defines a custom Monaco theme that dynamically uses the VS Code
 * theme's CSS variables for both UI chrome and syntax token colors.
 */
export function defineVscodeTheme({ tokenColors, themeColors, monaco, themeType }: VsCodeThemeProps) {
	const bodyClass = document.body.classList;
	let baseTheme: 'vs' | 'vs-dark' | 'hc-black' = 'vs-dark';

	// Prefer explicit theme type provided by the extension (recommended)
	if (themeType === 'light') {
		baseTheme = 'vs';
	} else if (themeType === 'dark') {
		baseTheme = 'vs-dark';
	} else if (themeType === 'hc-black') {
		baseTheme = 'hc-black';
	} else {
		// Fallback to DOM body classes if themeType not provided
		if (bodyClass.contains('vscode-light')) {
			baseTheme = 'vs';
		} else if (bodyClass.contains('vscode-high-contrast')) {
			baseTheme = 'hc-black';
		}
	}

	const rules = [];
	for (const rule of tokenColors) {
		const foreground = rule.settings?.foreground;
		if (!rule.scope || !foreground) {
			continue;
		}
		const color = colord(foreground);
		if (color.isValid()) {
			// Monaco expects colors in `#rrggbb` format
			const hex = color.toHex();
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
