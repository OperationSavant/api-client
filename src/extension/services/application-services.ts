import { ExtensionContext, Uri } from 'vscode';
import { RequestExecutorService } from './request-executor';
import { collectionService } from '@/domain/services/collectionService';
import { historyService } from '@/domain/services/history-service';
import { environmentService } from '@/domain/services/environment-service';
// import { storageService } from '@/domain/services/storageService';
import { AuthService } from './auth-service';
import { getDatabase, initializeDatabase } from './db-service';
import { SQLiteCollectionPersistence } from './collection-persistence';
import { SQLiteHistoryPersistence } from './history-persistence';
import { SQLiteEnvironmentPersistence } from './environment-persistence';

export class ApplicationServices {
	readonly requestExecutor: RequestExecutorService;
	readonly authService: AuthService;
	readonly collectionPersistence: SQLiteCollectionPersistence;
	readonly historyPersistence: SQLiteHistoryPersistence;
	readonly environmentPersistence: SQLiteEnvironmentPersistence;

	private constructor() {
		this.authService = new AuthService();
		this.requestExecutor = new RequestExecutorService(this.authService);
		const db = getDatabase();
		this.collectionPersistence = new SQLiteCollectionPersistence(db);
		this.historyPersistence = new SQLiteHistoryPersistence(db);
		this.environmentPersistence = new SQLiteEnvironmentPersistence(db);
	}

	public static async create(context: ExtensionContext): Promise<ApplicationServices> {
		const storageUri = context.globalStorageUri;
		const dbPath = Uri.joinPath(storageUri, 'api-client.db').fsPath;

		// Initialize database connection
		await initializeDatabase(dbPath);

		// Create services
		const services = new ApplicationServices();

		// Initialize persistence schemas (async)
		await services.collectionPersistence.init();
		await services.historyPersistence.init();
		await services.environmentPersistence.init();

		return services;
	}
}
