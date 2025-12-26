import type { WebviewViewMessage } from '@/shared/types/webview-messages';
import type { WebviewView } from 'vscode';
import { commands } from 'vscode';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';

export class SidebarHandler {
	constructor() {}

	async handle(message: WebviewViewMessage, webviewView: WebviewView): Promise<void> {
		switch (message.command) {
			case 'createNewRequest':
				await commands.executeCommand(message.command, ...(message.args || []));
				break;
			case 'sidebarReady':
			case 'refreshSidebar':
				await this.sendInitialData(webviewView);
				break;
			case 'openRequest':
				await commands.executeCommand(message.command, ...(message.args || []));
				break;
			case 'openCollectionView':
				await commands.executeCommand(message.command, ...(message.args || []));
				break;
		}
	}

	private async sendInitialData(webviewView: WebviewView): Promise<void> {
		try {
			const collectionService = await import('@/domain/services/collectionService').then(m => m.collectionService);
			await collectionService.loadFromPersistence();
			const collections = collectionService.getAllCollections();

			// Load history from persistence
			const historyService = await import('@/domain/services/history-service').then(m => m.historyService);
			await historyService.loadFromPersistence();
			const history = historyService.getAllHistory();

			broadcasterHub.broadcast({
				command: 'initializeDataFromExtension',
				collections,
				environments: [],
				history,
			});
		} catch (error) {
			console.error('Error sending initial data to sidebar:', error);

			broadcasterHub.broadcast({
				command: 'initializeDataFromExtension',
				collections: [],
				environments: [],
				history: [],
			});
		}
	}
}
