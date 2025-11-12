import { WebviewPanel, window } from 'vscode';
import { historyService } from '@/domain/services/history-service';
import { StateManager } from '../services/state-manager';

interface HistoryHandlerDependencies {
	historyService: typeof historyService;
}

export class HistoryHandler {
	constructor(private deps: HistoryHandlerDependencies) {}

	/**
	 * Clear all history
	 * ACTUAL CODE: extension.ts lines 156-164
	 */
	async handleClearHistory(message: any, panel: WebviewPanel): Promise<void> {
		const confirmation = await window.showWarningMessage('Clear all request history?', { modal: true }, 'Clear');

		if (confirmation === 'Clear') {
			this.deps.historyService.clearHistory();

			StateManager.saveState();

			window.showInformationMessage('History cleared.');
		}
	}

	/**
	 * Delete single history item
	 * NOTE: No webview message handler in commented code, but method exists in service
	 */
	async handleDeleteHistoryItem(message: any, panel: WebviewPanel): Promise<void> {
		const { historyId } = message;

		this.deps.historyService.deleteHistoryItem(historyId);

		StateManager.saveState();

		window.showInformationMessage('History item deleted.');
	}
}
