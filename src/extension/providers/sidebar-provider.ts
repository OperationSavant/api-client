import type { ExtensionContext, WebviewView, WebviewViewProvider } from 'vscode';
import { Uri } from 'vscode';
import type { MessageRouter } from '../orchestrators/message-router';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';
import { OrchestratorHelper } from '../orchestrators/orchestrator-helper';

export class SidebarProvider implements WebviewViewProvider {
	constructor(
		private readonly context: ExtensionContext,
		private readonly messageRouter: MessageRouter
	) {}

	resolveWebviewView(webviewView: WebviewView) {
		webviewView.title = 'API Client';
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [Uri.joinPath(this.context.extensionUri, 'dist')],
		};
		OrchestratorHelper.watchWebViewMessages(webviewView, this.messageRouter);
		const webviewUri = Uri.joinPath(this.context.extensionUri, 'dist', 'sidebar.js');
		OrchestratorHelper.configurePanel(webviewUri, webviewView, this.context, 'sidebar-root');
		broadcasterHub.registerWebviewView(webviewView);
	}
}
