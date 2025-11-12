import { ExtensionContext, Uri, ViewColumn, WebviewPanel, window } from 'vscode';
import { MessageRouter } from './message-router';
import { ThemeService } from '../services/theme-service';
import { WebviewContentBuilder } from '../services/webview-content-builder';

interface WebviewOrchestratorDependencies {
	context: ExtensionContext;
	messageRouter: MessageRouter;
}

export class WebviewOrchestrator {
	constructor(private deps: WebviewOrchestratorDependencies) {}

	/**
	 * Create and configure a new webview panel
	 * Returns configured panel ready for use
	 */
	createPanel(tabId: string, name?: string, args?: any[]): WebviewPanel {
		const panel = window.createWebviewPanel('apiClient', name || 'New Request', ViewColumn.One, {
			enableScripts: true,
			localResourceRoots: [Uri.joinPath(this.deps.context.extensionUri, 'dist')],
		});

		this.configurePanel(panel, tabId, args);

		return panel;
	}

	/**
	 * Configure webview panel with message handlers and content
	 */
	private configurePanel(panel: WebviewPanel, tabId: string, args?: any[]): void {
		const { context, messageRouter } = this.deps;

		const themeDisposable = ThemeService.watchThemeChanges(panel);

		panel.onDidDispose(() => {
			themeDisposable.dispose();
		});

		panel.webview.onDidReceiveMessage(
			async message => {
				await messageRouter.route(message, panel);
			},
			undefined,
			context.subscriptions
		);

		const webviewUri = Uri.joinPath(context.extensionUri, 'dist', 'main.js');
		panel.webview.html = WebviewContentBuilder.buildHtml(panel.webview, webviewUri, 'main-root');
	}
}
