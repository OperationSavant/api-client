import type { WebviewPanel, WebviewView} from 'vscode';
import { window } from 'vscode';

export class BroadcasterHub {
	private static instance: BroadcasterHub;
	private webviewPanels = new Map<string, { panel: WebviewPanel; initPayload: unknown }>();
	private webviewView: WebviewView | null = null;

	private constructor() {}

	static getInstance(): BroadcasterHub {
		if (!BroadcasterHub.instance) {
			BroadcasterHub.instance = new BroadcasterHub();
		}
		return BroadcasterHub.instance;
	}

	registerPanel(id: string, panel: WebviewPanel, args: unknown) {
		this.webviewPanels.set(id, { panel, initPayload: args });
		panel.onDidDispose(() => {
			this.webviewPanels.delete(id);
		});
	}

	registerWebviewView(view: WebviewView) {
		this.webviewView = view;
	}

	getPanelContext(panel: WebviewPanel): any | undefined {
		for (const {panel: registeredPanel, initPayload} of this.webviewPanels.values()) {
			if (registeredPanel === panel) {
				return initPayload;
			}
		}
	}

	broadcast(message: any) {
		for (const { panel } of this.webviewPanels.values()) {
			panel.webview.postMessage({ ...message });
		}
		this.webviewView?.webview.postMessage({ ...message });
	}

	broadcastException(message: any) {
		window.showErrorMessage(message || 'An unexpected error occurred');
	}
}

export const broadcasterHub = BroadcasterHub.getInstance();
