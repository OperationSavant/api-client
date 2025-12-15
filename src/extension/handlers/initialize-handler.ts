import { WebviewPanel } from 'vscode';
import { ThemeService } from '../services/theme-service';
import { collectionService } from '@/domain/services/collectionService';
import { environmentService } from '@/domain/services/environment-service';
import { historyService } from '@/domain/services/history-service';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';

export class InitializeHandler {
	constructor() {}

	async handle(message: any, panel: WebviewPanel): Promise<void> {
		const collections = collectionService.getAllCollections();
		const environments = environmentService.getScopes();
		const history = historyService.getAllHistory();

		ThemeService.sendThemeToWebview(panel);

		broadcasterHub.broadcast({
			command: 'initialize',
			collections: collections,
			environments: environments,
			history: history,
		});

		broadcasterHub.flushPendingMessages();
	}
}
