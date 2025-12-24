import { ExtensionContext, Uri, ViewColumn, WebviewPanel, window } from 'vscode';
import { MessageRouter } from './message-router';
import { ThemeService } from '../services/theme-service';
import { ContentBuilder } from '../services/webview-content-builder';
import { broadcasterHub } from './broadcaster-hub';

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
	createPanel(name?: string): WebviewPanel {
		const panel = window.createWebviewPanel('apiClient', name || 'New Request', ViewColumn.One, {
			enableScripts: true,
			localResourceRoots: [Uri.joinPath(this.deps.context.extensionUri, 'dist')],
		});

		this.configurePanel(panel);

		return panel;
	}

	/**
	 * Configure webview panel with message handlers and content
	 */
	private configurePanel(panel: WebviewPanel): void {
		const { context, messageRouter } = this.deps;

		const themeDisposable = ThemeService.watchThemeChanges(panel);

		panel.onDidDispose(() => {
			themeDisposable.dispose();
		});

		panel.webview.onDidReceiveMessage(
			async message => {
				try {
					await messageRouter.route(message, panel);
				} catch (error) {
					console.error('[WebviewOrchestrator] Message handling error:', error);
					// Send error to webview for user feedback
					broadcasterHub.broadcast({
						command: 'error',
						message: error instanceof Error ? error.message : 'An unexpected error occurred',
					});
				}
			},
			undefined,
			context.subscriptions
		);

		const webviewUri = Uri.joinPath(context.extensionUri, 'dist', 'main.js');
		panel.webview.html = ContentBuilder.buildHtml(panel.webview, webviewUri, 'main-root');
	}
}
