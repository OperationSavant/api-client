import type { WebviewPanel} from 'vscode';
import { window } from 'vscode';
import { historyService } from '@/domain/services/history-service';
import { unitOfWork } from '@/domain/services/unit-of-work';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';

export class HistoryHandler {
	constructor() {}

	private broadcastHistoryUpdate(): void {
		const allHistory = historyService.getAllHistory();
		broadcasterHub.broadcast({
			command: 'setHistory',
			history: allHistory,
		});
	} /**
	 * Clear all history
	 * ACTUAL CODE: extension.ts lines 156-164
	 */
	async handleClearHistory(message: any, panel: WebviewPanel): Promise<void> {
		const confirmation = await window.showWarningMessage('Clear all request history?', { modal: true }, 'Clear');

		if (confirmation === 'Clear') {
			try {
				// Domain operation (synchronous)
				historyService.clearHistory();

				// Commit to database (async)
				await unitOfWork.commit();

				// Broadcast update to all panels
				this.broadcastHistoryUpdate();

				window.showInformationMessage('History cleared.');
			} catch (error) {
				console.error('Failed to clear history:', error);

				// Rollback in-memory changes
				unitOfWork.rollback();

				window.showErrorMessage(`Failed to clear history: ${error instanceof Error ? error.message : 'Unknown error'}`);
				throw error;
			}
		}
	}

	/**
	 * Delete single history item
	 * NOTE: No webview message handler in commented code, but method exists in service
	 */
	async handleDeleteHistoryItem(message: any, panel: WebviewPanel): Promise<void> {
		try {
			const { historyId } = message;

			// Domain operation (synchronous)
			historyService.deleteHistoryItem(historyId);

			// Commit to database (async)
			await unitOfWork.commit();

			// Broadcast update to all panels
			this.broadcastHistoryUpdate();

			window.showInformationMessage('History item deleted.');
		} catch (error) {
			console.error('Failed to delete history item:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			window.showErrorMessage(`Failed to delete history item: ${error instanceof Error ? error.message : 'Unknown error'}`);
			throw error;
		}
	}
}
