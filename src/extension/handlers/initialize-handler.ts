import { WebviewPanel } from 'vscode';
import { collectionService } from '@/domain/services/collectionService';
import { environmentService } from '@/domain/services/environment-service';
import { historyService } from '@/domain/services/history-service';
import { ThemeService } from '../services/theme-service';
// Note: cookieService will be needed when cookie-integration is restored

interface InitializeHandlerDependencies {
	collectionService: typeof collectionService;
	environmentService: typeof environmentService;
	historyService: typeof historyService;
	// cookieService: CookieService; // TODO: Phase 4
}

export class InitializeHandler {
	constructor(private deps: InitializeHandlerDependencies) {}

	async handle(message: any, panel: WebviewPanel): Promise<void> {
		const collections = this.deps.collectionService.exportData();
		const environments = this.deps.environmentService.exportData();
		const history = this.deps.historyService.exportData();

		// const cookies = await this.deps.cookieService.getAllCookies();
		ThemeService.sendThemeToWebview(panel);
		panel.webview.postMessage({
			command: 'initialize',
			collections: collections,
			environments: environments,
			history: history,
		});
	}
}
