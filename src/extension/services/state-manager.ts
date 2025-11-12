import { storageService } from '@/domain/services/storageService';
import { collectionService } from '@/domain/services/collectionService';
import { historyService } from '@/domain/services/history-service';
import { environmentService } from '@/domain/services/environment-service';

export class StateManager {
	private static saveTimeout: NodeJS.Timeout | undefined;
	/**
	 * Save all application state to disk
	 * Called after any state-modifying operation
	 */
	static saveState(): void {
		clearTimeout(this.saveTimeout);
		this.saveTimeout = setTimeout(() => {
			const state = {
				collections: collectionService.exportData(),
				history: historyService.exportData(),
				environments: environmentService.exportData(),
			};
			storageService.saveState(state);
		}, 1000);
	}

	/**
	 * Load all application state from disk
	 * Called during extension activation
	 */
	static loadState(): void {
		const state = storageService.loadState();
		if (state) {
			collectionService.importData(state.collections);
			historyService.importData(state.history);
			environmentService.importData(state.environments);
		}
	}

	/**
	 * Immediately flush any pending state saves to disk
	 * Called during extension deactivation
	 */
	static flush(): void {
		clearTimeout(this.saveTimeout);
		const state = {
			collections: collectionService.exportData(),
			history: historyService.exportData(),
			environments: environmentService.exportData(),
		};
		storageService.saveState(state);
	}
}
