import { ExtensionContext, Uri } from 'vscode';
import { RequestExecutorService } from './request-executor';
import { collectionService } from '@/domain/services/collectionService';
import { historyService } from '@/domain/services/history-service';
import { environmentService } from '@/domain/services/environment-service';
import { storageService } from '@/domain/services/storageService';
import { AuthService } from './auth-service';
import { getDatabase, initializeDatabase } from './db-service';
import { SQLiteCollectionPersistence } from './collection-persistence';

export class ApplicationServices {
	readonly storage = storageService;
	readonly collections = collectionService;
	readonly history = historyService;
	readonly environment = environmentService;
	readonly requestExecutor: RequestExecutorService;
	readonly authService: AuthService;
	readonly collectionPersistence: SQLiteCollectionPersistence;

	constructor(private context: ExtensionContext) {
		const storageUri = context.globalStorageUri;
		this.authService = new AuthService();
		this.requestExecutor = new RequestExecutorService(storageUri, this.authService);
		const db = getDatabase();
		this.collectionPersistence = new SQLiteCollectionPersistence(db);
	}

	public static async create(context: ExtensionContext): Promise<ApplicationServices> {
		const storageUri = context.globalStorageUri;
		const dbPath = Uri.joinPath(storageUri, 'api-client.db').fsPath;
		await initializeDatabase(dbPath);
		return new ApplicationServices(context);
	}
}
