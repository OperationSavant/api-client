import { collectionService } from '@/domain/services/collectionService';
import { historyService } from '@/domain/services/history-service';
import { environmentService } from '@/domain/services/environment-service';
import { unitOfWork } from '@/domain/services/unit-of-work';
import { SQLiteCollectionPersistence } from './collection-persistence';
import { SQLiteHistoryPersistence } from './history-persistence';
import { getDatabase } from './db-service';
import { DatabaseTransaction } from './db-helpers';
import { ApplicationServices } from './application-services';

export class StateManager {
	static async initialize(services: ApplicationServices): Promise<void> {
		const db = getDatabase();

		// Create database transaction manager
		const transaction = new DatabaseTransaction(db);

		// ✅ Connect persistence adapters to domain services (legacy pattern)
		collectionService.setPersistence(services.collectionPersistence);
		historyService.setPersistence(services.historyPersistence);

		// ✅ Configure Unit of Work with persistence adapters and transaction
		unitOfWork.setPersistence(
			{
				collection: services.collectionPersistence,
				history: services.historyPersistence,
			},
			transaction
		);

		await this.loadState();
	}

	/**
	 * Load all application state from disk
	 * Called during extension activation
	 */
	private static async loadState(): Promise<void> {
		try {
			await collectionService.loadFromPersistence();
			console.log('Collections loaded from persistence');
		} catch (error) {
			console.error('Failed to load collections from persistence:', error);
			// Continue execution even if loading fails
		}

		try {
			await historyService.loadFromPersistence();
			console.log('History loaded from persistence');
		} catch (error) {
			console.error('Failed to load history from persistence:', error);
			// Continue execution even if loading fails
		}

		// TODO: Load environments from persistence when environment-persistence is updated
		// const state = storageService.loadState();
		// if (state) {
		// 	environmentService.importData(state.environments);
		// }
	}
}
