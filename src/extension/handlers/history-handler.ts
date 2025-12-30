import { window } from 'vscode';
import { historyService } from '@/domain/services/history-service';
import { unitOfWork } from '@/domain/services/unit-of-work';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';
import type { MessageEnvelope } from '@/shared/types/webview-messages';
import { SERVER_COMMANDS } from '@/shared/constants/commands';

export class HistoryHandler {
	constructor() {}

	private broadcastHistoryUpdate(): void {
		const allHistory = historyService.getAllHistory();
		broadcasterHub.broadcast({ command: SERVER_COMMANDS.SET_HISTORY, data: allHistory });
	} /**
	 * Clear all history
	 */
	async handleClearHistory(): Promise<void> {
		//TODO: Use BroadcastrHub to support multiple panels
		const confirmation = await window.showWarningMessage('Clear all request history?', { modal: true }, 'Clear');

		if (confirmation === 'Clear') {
			try {
				historyService.clearHistory();
				await unitOfWork.commit();
				this.broadcastHistoryUpdate();
				broadcasterHub.broadcastInformation('History cleared.');
			} catch (error) {
				console.error('Failed to clear history:', error);
				unitOfWork.rollback();
				broadcasterHub.broadcastException(`Failed to clear history: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}
	}

	/**
	 * Delete single history item
	 * NOTE: No webview message handler in commented code, but method exists in service
	 */
	async handleDeleteHistoryItem(message: MessageEnvelope): Promise<void> {
		try {
			historyService.deleteHistoryItem(message.payload as string);
			await unitOfWork.commit();
			this.broadcastHistoryUpdate();
			broadcasterHub.broadcastInformation('History item deleted.');
		} catch (error) {
			console.error('Failed to delete history item:', error);
			unitOfWork.rollback();
			broadcasterHub.broadcastException(`Failed to delete history item: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
}
