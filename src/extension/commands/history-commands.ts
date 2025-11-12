import { window } from 'vscode';
import { historyService } from '@/domain/services/history-service';

interface HistoryCommandDependencies {
	saveState: () => void;
	// refreshProvider: () => void;
}

export class HistoryCommands {
	constructor(private deps: HistoryCommandDependencies) {}

	/**
	 * Command: apiClient.clearHistory
	 * Shows confirmation → clears all history → refreshes UI
	 */
	async clearHistory(): Promise<void> {
		const confirmation = await window.showWarningMessage('Clear all request history?', { modal: true }, 'Clear');

		if (confirmation !== 'Clear') return;

		historyService.clearHistory();

		// this.deps.refreshProvider();
	}

	/**
	 * Command: apiClient.refreshHistory
	 * Manually refresh history tree view
	 */
	refresh(): void {
		// this.deps.refreshProvider();
	}
}
