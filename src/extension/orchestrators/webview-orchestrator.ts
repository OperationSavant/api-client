import type { ExtensionContext, WebviewPanel } from 'vscode';
import { Uri, ViewColumn } from 'vscode';
import type { MessageRouter } from './message-router';
import { broadcasterHub } from './broadcaster-hub';
import { OrchestratorHelper } from './orchestrator-helper';

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
	createPanel(name?: string, scriptName?: string, rootId?: string): WebviewPanel {
		const newPanel = OrchestratorHelper.createPanel(this.deps.context.extensionUri, 'apiClient', name || 'New Request', ViewColumn.One);

		this.configurePanel(newPanel, scriptName || 'main.js', rootId || 'main-root');

		return newPanel;
	}

	/**
	 * Configure webview panel with message handlers and content
	 */
	private configurePanel(panel: WebviewPanel, scriptName: string, rootId: string): void {
		const { context, messageRouter } = this.deps;

		// const themeDisposable = ThemeService.watchThemeChanges(panel);

		// panel.onDidDispose(() => {
		// 	themeDisposable.dispose();
		// });

		OrchestratorHelper.watchWebViewMessages(panel, messageRouter, context);

		const webviewUri = Uri.joinPath(context.extensionUri, 'dist', scriptName);
		OrchestratorHelper.configurePanel(webviewUri, panel, context, rootId);
	}
}
