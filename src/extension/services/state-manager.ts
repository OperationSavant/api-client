import { collectionService } from '@/domain/services/collectionService';
import { historyService } from '@/domain/services/history-service';
import { environmentService } from '@/domain/services/environment-service';
import { unitOfWork } from '@/domain/services/unit-of-work';
import { SQLiteCollectionPersistence } from './collection-persistence';
import { SQLiteHistoryPersistence } from './history-persistence';
import { getDatabase } from './db-service';
import { DatabaseTransaction } from './db-helpers';

export class StateManager {
	static async initialize(): Promise<void> {
		const db = getDatabase();

		// Create persistence adapters
		const collectionPersistence = new SQLiteCollectionPersistence(db);
		const historyPersistence = new SQLiteHistoryPersistence(db);

		// Create database transaction manager
		const transaction = new DatabaseTransaction(db);

		// ✅ Connect persistence adapters to domain services (legacy pattern)
		collectionService.setPersistence(collectionPersistence);
		historyService.setPersistence(historyPersistence);

		// ✅ Configure Unit of Work with persistence adapters and transaction
		unitOfWork.setPersistence(
			{
				collection: collectionPersistence,
				history: historyPersistence,
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
