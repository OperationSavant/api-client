import type { WebviewPanel } from 'vscode';
import { collectionService } from '@/domain/services/collectionService';
import { environmentService } from '@/domain/services/environment-service';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';
import { SERVER_COMMANDS } from '@/shared/constants/commands';

export class InitializeHandler {
	constructor() {}

	async handle(panel: WebviewPanel): Promise<void> {
		const collections = collectionService.getAllCollections();
		const environments = environmentService.getScopes();
		const context = broadcasterHub.getPanelContext(panel);
		broadcasterHub.broadcast({
			command: SERVER_COMMANDS.WEBVIEW_INITIALIZE,
			data: { collections: collections, environments: environments, metadata: context?.initPayload, previewContainerUri: context?.previewContainerUri || null },
		});
	}
}
