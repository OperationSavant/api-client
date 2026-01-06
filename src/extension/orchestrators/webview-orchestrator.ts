import type { ExtensionContext, WebviewPanel } from 'vscode';
import { Uri, ViewColumn } from 'vscode';
import type { MessageRouter } from './message-router';
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
	createPanel(name: string, scriptName: string, rootId: string): { newPanel: WebviewPanel; previewUri: string } {
		const newPanel = OrchestratorHelper.createPanel(this.deps.context.extensionUri, 'apiClient', name, ViewColumn.One);
		const previewUri = this.configurePanel(newPanel, scriptName, rootId);
		return { newPanel, previewUri };
	}

	/**
	 * Configure webview panel with message handlers and content
	 */
	private configurePanel(panel: WebviewPanel, scriptName: string, rootId: string): string {
		const { context, messageRouter } = this.deps;

		OrchestratorHelper.watchWebViewMessages(panel, messageRouter, context);

		const webviewUri = Uri.joinPath(context.extensionUri, 'dist', scriptName);
		return OrchestratorHelper.configurePanel(webviewUri, panel, context, rootId);
	}
}
