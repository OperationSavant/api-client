import { collectionService } from '@/domain/services/collectionService';
import { WebviewViewMessage } from '@/shared/types/webview-messages';
import { commands, WebviewView } from 'vscode';

export class SidebarHandler {
	constructor() {}

	async handle(message: WebviewViewMessage, webviewView: WebviewView): Promise<void> {
		switch (message.command) {
			case 'createNewRequest':
				await commands.executeCommand(message.commandId, ...(message.args || []));
				break;

			case 'sidebarReady':
			case 'refreshSidebar':
				await this.sendInitialData(webviewView);
				break;
			case 'openRequest':
				await commands.executeCommand(message.commandId, ...(message.args || []));
				break;
		}
	}

	private async sendInitialData(webviewView: WebviewView): Promise<void> {
		try {
			await collectionService.loadFromPersistence();
			const collections = collectionService.getAllCollections();

			// Load history from persistence
			const historyService = await import('@/domain/services/history-service').then(m => m.historyService);
			await historyService.loadFromPersistence();
			const history = historyService.getAllHistory();

			webviewView.webview.postMessage({
				command: 'initializeDataFromExtension',
				collections,
				environments: [],
				history,
			});
		} catch (error) {
			console.error('Error sending initial data to sidebar:', error);

			webviewView.webview.postMessage({
				command: 'initializeDataFromExtension',
				collections: [],
				environments: [],
				history: [],
			});
		}
	}
}
