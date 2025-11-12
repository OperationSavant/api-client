import { WebviewPanel, workspace, extensions } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as jsonc from 'jsonc-parser';

export class ThemeService {
	private static themeCache = new Map<string, any>();
	/**
	 * Send current VSCode theme token colors to webview
	 * Used for Monaco Editor syntax highlighting synchronization
	 */
	static sendThemeToWebview(panel: WebviewPanel): void {
		try {
			const themeName = workspace.getConfiguration('workbench').get<string>('colorTheme');

			if (this.themeCache.has(themeName!)) {
				panel.webview.postMessage({
					command: 'themeData',
					tokenColors: this.themeCache.get(themeName!),
				});
				return;
			}

			const themeExtension = extensions.all.find(ext => ext.packageJSON?.contributes?.themes?.some((t: any) => t.label === themeName || t.id === themeName));

			if (!themeExtension) {
				console.warn('ThemeService: No theme extension found for', themeName);
				return;
			}

			const themeInfo = themeExtension.packageJSON.contributes.themes.find((t: any) => t.label === themeName || t.id === themeName);

			if (!themeInfo) {
				console.error('ThemeService: Could not find theme info in extension package.json.');
				return;
			}

			const themePath = path.join(themeExtension.extensionPath, themeInfo.path);

			const fileContent = fs.readFileSync(themePath, 'utf-8');
			const themeContent = jsonc.parse(fileContent);
			const tokenColors = themeContent.tokenColors || [];

			this.themeCache.set(themeName!, tokenColors);
			panel.webview.postMessage({
				command: 'themeData',
				tokenColors,
			});
		} catch (e) {
			console.error('ThemeService: Error reading theme file:', e);
		}
	}

	/**
	 * Setup theme change listener for a webview panel
	 * Returns disposable to clean up listener
	 */
	static watchThemeChanges(panel: WebviewPanel): { dispose: () => void } {
		const disposable = workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('workbench.colorTheme')) {
				this.sendThemeToWebview(panel);
			}
		});

		return disposable;
	}
}
