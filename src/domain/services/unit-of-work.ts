/**
 * Unit of Work Pattern Implementation
 *
 * Coordinates persistence of multiple entity changes in a single atomic transaction.
 * Domain services register entity changes (new/modified/removed), and handlers commit all at once.
 *
 * Benefits:
 * - Separation of concerns: Domain services don't know about persistence timing
 * - Atomic operations: All changes commit/rollback together
 * - Performance: Batch multiple operations into single transaction
 * - Rollback support: Can restore in-memory state if persistence fails
 */

import type { ICollectionPersistence } from '@/domain/types/collection-persistence';
import type { IHistoryPersistence } from '@/domain/types/history-persistence';
import type { DatabaseTransaction } from '@/extension/services/db-helpers';

/**
 * Domain error for Unit of Work failures
 * Avoids dependency on infrastructure layer (db-helpers)
 */
class UnitOfWorkError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown
	) {
		super(message);
		this.name = 'UnitOfWorkError';
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, UnitOfWorkError);
		}
	}
}

// ==================== TYPES ====================

/**
 * Entity types supported by Unit of Work
 */
export type EntityType = 'collection' | 'folder' | 'request' | 'history' | 'environment';

/**
 * Entity state in Unit of Work
 */
export type EntityState = 'new' | 'modified' | 'removed';

/**
 * Tracked entity with metadata for persistence
 */
interface TrackedEntity {
	entity: any;
	type: EntityType;
	state: EntityState;
	originalData?: any; // For rollback (clone of original state)
	metadata?: {
		collectionId?: string; // For folder/request persistence
	};
}

/**
 * Persistence adapters configuration
 */
interface PersistenceAdapters {
	collection?: ICollectionPersistence;
	history?: IHistoryPersistence;
	// Add environment when implemented
}

// ==================== UNIT OF WORK ====================

/**
 * Unit of Work - Coordinates persistence of multiple entity changes
 *
 * Usage Pattern:
 * ```typescript
 * // In domain service:
 * createCollection(name: string): Collection {
 *     const collection = { id: uuid(), name, ... };
 *     this.collections.set(collection.id, collection);
 *     unitOfWork.registerNew(collection, 'collection');
 *     return collection;
 * }
 *
 * // In handler:
 * async handleCreateCollection(message, panel) {
 *     const collection = collectionService.createCollection(message.name);
 *     await unitOfWork.commit();  // Persist all changes atomically
 * }
 * ```
 */
export class UnitOfWork {
	private newEntities: Map<string, TrackedEntity> = new Map();
	private modifiedEntities: Map<string, TrackedEntity> = new Map();
	private removedEntities: Map<string, TrackedEntity> = new Map();

	// Persistence adapters (injected)
	private collectionPersistence: ICollectionPersistence | null = null;
	private historyPersistence: IHistoryPersistence | null = null;
	private transaction: DatabaseTransaction | null = null;

	/**
	 * Inject persistence adapters (called during initialization)
	 */
	setPersistence(adapters: PersistenceAdapters, transaction?: DatabaseTransaction): void {
		this.collectionPersistence = adapters.collection || null;
		this.historyPersistence = adapters.history || null;
		if (transaction) {
			this.transaction = transaction;
		}
	}

	/**
	 * Register a new entity to be created
	 */
	registerNew(entity: any, type: EntityType): void {
		const id = this.getEntityId(entity, type);

		// Remove from modified/removed if previously tracked
		this.modifiedEntities.delete(id);
		this.removedEntities.delete(id);

		// Add to new entities
		this.newEntities.set(id, {
			entity,
			type,
			state: 'new',
		});
	}

	/**
	 * Register an entity as modified
	 */
	registerModified(entity: any, type: EntityType, originalData?: any): void {
		const id = this.getEntityId(entity, type);

		// Skip if already marked as new (will be inserted anyway)
		if (this.newEntities.has(id)) {
			return;
		}

		// Skip if already marked as removed
		if (this.removedEntities.has(id)) {
			return;
		}

		// Add to modified entities
		this.modifiedEntities.set(id, {
			entity,
			type,
			state: 'modified',
			originalData: originalData || null,
		});
	}

	/**
	 * Register an entity to be deleted
	 */
	registerRemoved(entity: any, type: EntityType): void {
		const id = this.getEntityId(entity, type);

		// If entity was marked as new, just remove from tracking
		if (this.newEntities.has(id)) {
			this.newEntities.delete(id);
			return;
		}

		// Remove from modified
		this.modifiedEntities.delete(id);

		// Add to removed entities
		this.removedEntities.set(id, {
			entity,
			type,
			state: 'removed',
		});
	}

	/**
	 * Commit all tracked changes to persistence layer
	 * Uses atomic transaction for consistency
	 */
	async commit(): Promise<void> {
		// No changes to persist
		if (this.newEntities.size === 0 && this.modifiedEntities.size === 0 && this.removedEntities.size === 0) {
			return;
		}

		try {
			// Begin database transaction if available
			if (this.transaction) {
				await this.transaction.begin();
			}

			// 1. Process NEW entities (inserts)
			for (const [id, tracked] of this.newEntities) {
				await this.persistNew(tracked);
			}

			// 2. Process MODIFIED entities (updates)
			for (const [id, tracked] of this.modifiedEntities) {
				await this.persistModified(tracked);
			}

			// 3. Process REMOVED entities (deletes)
			for (const [id, tracked] of this.removedEntities) {
				await this.persistRemoved(tracked);
			}

			// Commit database transaction if available
			if (this.transaction) {
				await this.transaction.commit();
			}

			// Clear tracking after successful commit
			this.clear();
		} catch (error) {
			// Rollback database transaction if available
			if (this.transaction) {
				await this.transaction.rollback();
			}
			throw new UnitOfWorkError('Unit of Work commit failed', error);
		}
	}

	/**
	 * Rollback all in-memory changes (restore original data)
	 * NOTE: Does NOT rollback database - use DatabaseTransaction for that
	 */
	rollback(): void {
		// Restore modified entities to original state
		for (const [id, tracked] of this.modifiedEntities) {
			if (tracked.originalData) {
				Object.assign(tracked.entity, tracked.originalData);
			}
		}

		this.clear();
	}

	/**
	 * Clear all tracked entities
	 */
	clear(): void {
		this.newEntities.clear();
		this.modifiedEntities.clear();
		this.removedEntities.clear();
	}

	/**
	 * Check if there are pending changes
	 */
	hasPendingChanges(): boolean {
		return this.newEntities.size > 0 || this.modifiedEntities.size > 0 || this.removedEntities.size > 0;
	}

	/**
	 * Get count of pending changes
	 */
	getPendingChangesCount(): { new: number; modified: number; removed: number } {
		return {
			new: this.newEntities.size,
			modified: this.modifiedEntities.size,
			removed: this.removedEntities.size,
		};
	}

	// ==================== PRIVATE HELPERS ====================

	/**
	 * Extract entity ID based on type
	 */
	private getEntityId(entity: any, type: EntityType): string {
		switch (type) {
			case 'collection':
				return entity.id || entity.collectionId;
			case 'folder':
				return entity.id || entity.folderId;
			case 'request':
				return entity.id || entity.requestId;
			case 'history':
				return entity.historyId;
			case 'environment':
				return entity.id || entity.environmentId;
			default: {
				const _exhaustive: never = type;
				throw new Error(`Unknown entity type: ${_exhaustive}`);
			}
		}
	}

	/**
	 * Persist a new entity (INSERT)
	 */
	private async persistNew(tracked: TrackedEntity): Promise<void> {
		switch (tracked.type) {
			case 'collection':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.createCollection(tracked.entity);
				break;

			case 'folder':
				if (!this.collectionPersistence) {
					throw new UnitOfWorkError('Collection persistence not configured');
				}
				const collectionId = (tracked.entity as any).collectionId;
				if (!collectionId) {
					throw new UnitOfWorkError('Folder entity missing collectionId - ensure collectionId is set in domain service');
				}
				await this.collectionPersistence.createFolder(collectionId, tracked.entity);
				break;

			case 'request':
				if (!this.collectionPersistence) {
					throw new UnitOfWorkError('Collection persistence not configured');
				}
				const reqCollectionId = (tracked.entity as any).collectionId;
				if (!reqCollectionId) {
					throw new UnitOfWorkError('Request entity missing collectionId - ensure collectionId is set in domain service');
				}
				await this.collectionPersistence.createRequest(tracked.entity, reqCollectionId);
				break;

			case 'history':
				if (!this.historyPersistence) {
					throw new Error('History persistence not configured');
				}
				await this.historyPersistence.create(tracked.entity);
				break;

			case 'environment':
				// TODO: Implement when environment persistence is updated
				throw new Error('Environment persistence not yet implemented in UoW');

			default: {
				const _exhaustive: never = tracked.type;
				throw new Error(`Cannot persist new entity of type: ${_exhaustive}`);
			}
		}
	}

	/**
	 * Persist a modified entity (UPDATE)
	 */
	private async persistModified(tracked: TrackedEntity): Promise<void> {
		switch (tracked.type) {
			case 'collection':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				// Use full entity as partial update (contains all fields)
				await this.collectionPersistence.updateCollection(tracked.entity.id, tracked.entity);
				break;

			case 'folder':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				// Use full entity as partial update (contains all fields)
				await this.collectionPersistence.updateFolder(tracked.entity.id, tracked.entity);
				break;

			case 'request':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				// Use full entity as partial update (contains all fields)
				await this.collectionPersistence.updateRequest(tracked.entity.id, tracked.entity);
				break;

			case 'history':
				// History items are typically immutable (not modified after creation)
				throw new Error('History items cannot be modified (immutable)');

			case 'environment':
				// TODO: Implement when environment persistence is updated
				throw new Error('Environment persistence not yet implemented in UoW');

			default: {
				const _exhaustive: never = tracked.type;
				throw new Error(`Cannot persist modified entity of type: ${_exhaustive}`);
			}
		}
	}

	/**
	 * Persist a removed entity (DELETE)
	 */
	private async persistRemoved(tracked: TrackedEntity): Promise<void> {
		const id = this.getEntityId(tracked.entity, tracked.type);

		switch (tracked.type) {
			case 'collection':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.deleteCollection(id);
				break;

			case 'folder':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.deleteFolder(id);
				break;

			case 'request':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.deleteRequest(id);
				break;

			case 'history':
				if (!this.historyPersistence) {
					throw new Error('History persistence not configured');
				}
				await this.historyPersistence.delete(id);
				break;

			case 'environment':
				// TODO: Implement when environment persistence is updated
				throw new Error('Environment persistence not yet implemented in UoW');

			default: {
				const _exhaustive: never = tracked.type;
				throw new Error(`Cannot persist removed entity of type: ${_exhaustive}`);
			}
		}
	}
}

// ==================== SINGLETON EXPORT ====================

/**
 * Singleton instance for use across the application
 */
export const unitOfWork = new UnitOfWork();
