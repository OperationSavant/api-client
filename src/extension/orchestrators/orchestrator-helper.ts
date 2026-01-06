import type { ExtensionContext, ViewColumn, WebviewPanel, WebviewView } from 'vscode';
import { Uri } from 'vscode';
import { window } from 'vscode';
import { ContentBuilder } from '../services/webview-content-builder';
import { broadcasterHub } from './broadcaster-hub';
import type { MessageRouter } from './message-router';
import type { MessageEnvelope } from '@/shared/types/webview-messages';
import { SERVER_COMMANDS } from '@/shared/constants/commands';

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
			  }
	): WebviewPanel {
		const panel = window.createWebviewPanel(viewType, title, showOptions, {
			enableScripts: true,
			localResourceRoots: [Uri.joinPath(extensionUri, 'dist')],
		});
		return panel;
	}

	static configurePanel(webviewUri: Uri, panel: WebviewPanel | WebviewView, context: ExtensionContext, rootId: string): string {
		const { html, previewUri } = ContentBuilder.buildHtml(panel.webview, webviewUri, context, rootId);
		panel.webview.html = html;
		return previewUri;
	}

	static watchWebViewMessages(panel: WebviewPanel | WebviewView, messageRouter: MessageRouter, context?: ExtensionContext) {
		const isWebviewPanel = 'reveal' in panel;
		const isWebviewView = 'show' in panel;
		panel.webview.onDidReceiveMessage(
			async (message: MessageEnvelope) => {
				try {
					if (isWebviewPanel && message.source === 'webview') await messageRouter.route(message, panel);
					else if (isWebviewView && message.source === 'webviewView') await messageRouter.route(message, panel);
				} catch (error) {
					console.error(`[OrchestratorHelper - ${isWebviewPanel ? 'WebviewPanel' : isWebviewView ? 'WebviewView' : 'Unknown'}] Message handling error:`, error);
					broadcasterHub.broadcast({ command: SERVER_COMMANDS.SERVER_ERROR });
					broadcasterHub.broadcastException(error instanceof Error ? error.message : 'An unexpected error occurred');
				}
			},
			undefined,
			context?.subscriptions
		);
	}
}
