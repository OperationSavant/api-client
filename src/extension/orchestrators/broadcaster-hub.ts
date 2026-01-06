import type { WebviewPanel, WebviewView } from 'vscode';
import { window } from 'vscode';

interface RegisterPanelProps {
	initPayload: unknown;
	previewContainerUri?: string;
}

export class BroadcasterHub {
	private static instance: BroadcasterHub;
	private webviewPanels = new Map<WebviewPanel, RegisterPanelProps>();
	private webviewView: WebviewView | null = null;

	private constructor() {}

	static getInstance(): BroadcasterHub {
		if (!BroadcasterHub.instance) {
			BroadcasterHub.instance = new BroadcasterHub();
		}
		return BroadcasterHub.instance;
	}

	registerPanel({ panel, initPayload, previewContainerUri }: { panel: WebviewPanel } & RegisterPanelProps) {
		this.webviewPanels.set(panel, { initPayload, previewContainerUri });
		panel.onDidDispose(() => {
			this.webviewPanels.delete(panel);
		});
	}

	registerWebviewView(view: WebviewView) {
		this.webviewView = view;
	}

	getPanelContext(panel: WebviewPanel): { initPayload?: unknown; previewContainerUri?: string } | undefined {
		const { initPayload, previewContainerUri } = this.webviewPanels.get(panel) || {};
		return { initPayload, previewContainerUri };
	}

	broadcast({ command, data }: { command: string; data?: unknown }) {
		for (const panel of this.webviewPanels.keys()) {
			panel.webview.postMessage({ command, data });
		}
		this.webviewView?.webview.postMessage({ command, data });
	}

	broadcastToSpecificPanel(panel: WebviewPanel, message: { command: string; data?: unknown }) {
		const panelContext = this.webviewPanels.get(panel);
		if (panelContext) {
			panel.webview.postMessage(message);
		}
	}

	broadcastInformation(message: string) {
		window.showInformationMessage(message);
	}

	broadcastException(message: string | undefined) {
		window.showErrorMessage(message || 'An unexpected error occurred');
	}
}

export const broadcasterHub = BroadcasterHub.getInstance();
