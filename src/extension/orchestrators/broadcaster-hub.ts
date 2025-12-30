import type { WebviewPanel, WebviewView } from 'vscode';
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

	getPanelContext(panel: WebviewPanel): unknown | undefined {
		for (const { panel: registeredPanel, initPayload } of this.webviewPanels.values()) {
			if (registeredPanel === panel) {
				return initPayload;
			}
		}
	}

	broadcast({ command, data }: { command: string; data?: unknown }) {
		for (const { panel } of this.webviewPanels.values()) {
			panel.webview.postMessage({ command, data });
		}
		this.webviewView?.webview.postMessage({ command, data });
	}

	broadcastInformation(message: string) {
		window.showInformationMessage(message);
	}

	broadcastException(message: string | undefined) {
		window.showErrorMessage(message || 'An unexpected error occurred');
	}
}

export const broadcasterHub = BroadcasterHub.getInstance();
