import { WebviewPanel, WebviewView, window } from 'vscode';

export class BroadcasterHub {
	private static instance: BroadcasterHub;
	private webviewPanels = new Map<string, WebviewPanel>();
	private webviewView: WebviewView | null = null;
	private pendingMessages = new Map<string, any[]>();

	private constructor() {}

	static getInstance(): BroadcasterHub {
		if (!BroadcasterHub.instance) {
			BroadcasterHub.instance = new BroadcasterHub();
		}
		return BroadcasterHub.instance;
	}

	registerPanel(id: string, panel: WebviewPanel, args?: any[]) {
		this.webviewPanels.set(id, panel);
		panel.onDidDispose(() => {
			this.webviewPanels.delete(id);
			this.pendingMessages.delete(id);
		});
	}

	registerWebviewView(view: WebviewView) {
		this.webviewView = view;
	}

	setPendingmessages(panelId: string, args?: any[]) {
		if (args && args.length > 0) {
			this.pendingMessages.set(panelId, [
				{
					command: 'loadRequest',
					data: {
						tabId: panelId,
						request: args[0],
					},
				},
			]);
		}
	}

	flushPendingMessages(panelId?: string) {
		if (panelId) {
			// Flush for specific panel
			const messages = this.pendingMessages.get(panelId);
			const panel = this.webviewPanels.get(panelId);
			if (messages && panel) {
				messages.forEach(msg => panel.webview.postMessage(msg));
				this.pendingMessages.delete(panelId);
			}
		} else {
			// Flush all pending
			this.pendingMessages.forEach((messages, id) => {
				const panel = this.webviewPanels.get(id);
				if (panel) {
					messages.forEach(msg => panel.webview.postMessage(msg));
				}
			});
			this.pendingMessages.clear();
		}
	}

	broadcast(message: any) {
		for (const panel of this.webviewPanels) {
			panel[1]?.webview.postMessage({ ...message });
		}
		this.webviewView?.webview.postMessage({ ...message });
	}

	broadcastException(message: any) {
		window.showErrorMessage(message || 'An unexpected error occurred');
	}
}

export const broadcasterHub = BroadcasterHub.getInstance();
