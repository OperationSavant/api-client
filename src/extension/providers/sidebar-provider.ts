import type { ExtensionContext, WebviewView, WebviewViewProvider } from 'vscode';
import { Uri } from 'vscode';
import { ContentBuilder } from '../services/webview-content-builder';
import type { MessageRouter } from '../orchestrators/message-router';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';
import { OrchestratorHelper } from '../orchestrators/orchestrator-helper';

export class SidebarProvider implements WebviewViewProvider {
	constructor(
		private readonly extensionUri: Uri,
		private readonly messageRouter: MessageRouter
	) {}

	resolveWebviewView(webviewView: WebviewView) {
		webviewView.title = 'API Client';
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [Uri.joinPath(this.extensionUri, 'dist')],
		};
		// webviewView.webview.onDidReceiveMessage(async message => {
		// 	try {
		// 		await this.messageRouter.route(message, webviewView);
		// 	} catch (error) {
		// 		console.error('[SidebarProvider] Message handling error:', error);
		// 		// Send error to webview for user feedback
		// 		broadcasterHub.broadcast({
		// 			command: 'error',
		// 			message: error instanceof Error ? error.message : 'An unexpected error occurred',
		// 		});
		// 	}
		// });
		OrchestratorHelper.watchWebViewMessages(webviewView, this.messageRouter);
		const webviewUri = Uri.joinPath(this.extensionUri, 'dist', 'sidebar.js');
		OrchestratorHelper.configurePanel(webviewUri, webviewView, { extensionUri: this.extensionUri } as ExtensionContext, 'sidebar-root');
		broadcasterHub.registerWebviewView(webviewView);
	}
}
