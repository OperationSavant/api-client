import { ExtensionContext } from 'vscode';
import { RequestExecutorService } from './request-executor';
import { collectionService } from '@/domain/services/collectionService';
import { historyService } from '@/domain/services/history-service';
import { environmentService } from '@/domain/services/environment-service';
import { storageService } from '@/domain/services/storageService';
import { AuthService } from './auth-service';

export class ApplicationServices {
	readonly storage = storageService;
	readonly collections = collectionService;
	readonly history = historyService;
	readonly environment = environmentService;

	// Extension services (new instances)
	readonly requestExecutor: RequestExecutorService;
	readonly authService: AuthService;

	constructor(private context: ExtensionContext) {
		const storageUri = context.storageUri || context.globalStorageUri;
		this.authService = new AuthService();
		this.requestExecutor = new RequestExecutorService(storageUri, this.authService);
	}
}
