import { Uri, WebviewView, WebviewViewProvider } from 'vscode';
import { ContentBuilder } from '../services/webview-content-builder';
import { MessageRouter } from '../orchestrators/message-router';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';

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
		webviewView.webview.onDidReceiveMessage(async message => {
			try {
				await this.messageRouter.route(message, webviewView);
			} catch (error) {
				console.error('[SidebarProvider] Message handling error:', error);
				// Send error to webview for user feedback
				broadcasterHub.broadcast({
					command: 'error',
					message: error instanceof Error ? error.message : 'An unexpected error occurred',
				});
			}
		});
		const webviewUri = Uri.joinPath(this.extensionUri, 'dist', 'sidebar.js');
		webviewView.webview.html = ContentBuilder.buildHtml(webviewView.webview, webviewUri, 'sidebar-root');
		broadcasterHub.registerWebviewView(webviewView);
	}
}
