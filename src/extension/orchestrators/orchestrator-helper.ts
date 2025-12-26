import type { ExtensionContext, ViewColumn, WebviewOptions, WebviewPanel, WebviewPanelOptions, WebviewView} from 'vscode';
import { Uri, window } from 'vscode';
import { ContentBuilder } from '../services/webview-content-builder';
import { broadcasterHub } from './broadcaster-hub';
import type { MessageRouter } from './message-router';
import type { WebviewMessage, WebviewViewMessage } from '@/shared/types/webview-messages';

export class OrchestratorHelper {
	static createPanel(
		extensionUri: Uri,
		viewType: string,
		title: string,
		showOptions:
			| ViewColumn
			| {
					readonly viewColumn: ViewColumn;
					readonly preserveFocus?: boolean;
			  },
		options?: WebviewPanelOptions & WebviewOptions
	): WebviewPanel {
		const panel = window.createWebviewPanel(viewType, title, showOptions, {
			enableScripts: true,
			localResourceRoots: [Uri.joinPath(extensionUri, 'dist')],
		});
		return panel;
	}

	static configurePanel(webviewUri: Uri, panel: WebviewPanel | WebviewView, context: ExtensionContext, rootId: string): void {
		panel.webview.html = ContentBuilder.buildHtml(panel.webview, webviewUri, rootId);
	}

	static watchWebViewMessages(panel: WebviewPanel | WebviewView, messageRouter: MessageRouter, context?: ExtensionContext) {
		const isWebviewPanel = 'reveal' in panel;
		const isWebviewView = 'show' in panel;
		panel.webview.onDidReceiveMessage(
			async (message: WebviewMessage | WebviewViewMessage) => {
				try {
					if (isWebviewPanel && message.source === 'webview') await messageRouter.route(message, panel);
					else if (isWebviewView && message.source === 'webviewView') await messageRouter.route(message, panel);
				} catch (error) {
					console.error(`[OrchestratorHelper - ${isWebviewPanel ? 'WebviewPanel' : isWebviewView ? 'WebviewView' : 'Unknown'}] Message handling error:`, error);
					// Send error to webview for user feedback
					broadcasterHub.broadcast({
						command: 'error',
						message: error instanceof Error ? error.message : 'An unexpected error occurred',
					});
					broadcasterHub.broadcastException(error instanceof Error ? error.message : 'An unexpected error occurred');
				}
			},
			undefined,
			context?.subscriptions
		);
	}
}
