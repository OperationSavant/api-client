import type { MessageEnvelope } from '@/shared/types/webview-messages';
import { commands } from 'vscode';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';
import type { Request } from '@/shared/types/request';
import type { Collection } from '@/shared/types/collection';
import { CLIENT_COMMANDS, SERVER_COMMANDS } from '@/shared/constants/commands';

export class SidebarHandler {
	constructor() {}

	async handle(message: MessageEnvelope): Promise<void> {
		switch (message.command) {
			case CLIENT_COMMANDS.CREATE_REQUEST:
				await commands.executeCommand(message.command);
				break;
			case CLIENT_COMMANDS.SIDEBAR_READY:
			case CLIENT_COMMANDS.REFRESH_SIDEBAR:
				await this.sendInitialData();
				break;
			case CLIENT_COMMANDS.OPEN_REQUEST:
				await commands.executeCommand(message.command, ...((message.payload as Request[]) || []));
				break;
			case CLIENT_COMMANDS.OPEN_COLLECTION_VIEW:
				await commands.executeCommand(message.command, ...([message.payload as Collection] || []));
				break;
		}
	}

	private async sendInitialData(): Promise<void> {
		try {
			const collectionService = await import('@/domain/services/collectionService').then(m => m.collectionService);
			await collectionService.loadFromPersistence();
			const collections = collectionService.getAllCollections();

			// Load history from persistence
			const historyService = await import('@/domain/services/history-service').then(m => m.historyService);
			await historyService.loadFromPersistence();
			const history = historyService.getAllHistory();

			//TODO: load all environments once implemented

			broadcasterHub.broadcast({
				command: SERVER_COMMANDS.SIDEBAR_INITIALIZE,
				data: { collections, environments: [], history },
			});
		} catch (error) {
			console.error('Error sending initial data to sidebar:', error);

			broadcasterHub.broadcast({
				command: SERVER_COMMANDS.SIDEBAR_INITIALIZE,
				data: { collections: [], environments: [], history: [] },
			});

			broadcasterHub.broadcastException(`Error sending initial data to sidebar: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
		}
	}
}
