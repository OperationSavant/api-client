import { Collection, CollectionFolder, CollectionRequest } from '@/shared/types/collection';

/**
 * Port interface for collection persistence
 * Implementations: SQLite, JSON, In-Memory (for tests)
 */
export interface ICollectionPersistence {
	/**
	 * Initialize storage (create tables, etc.)
	 */
	init(): void;

	/**
	 * Load all collections with nested folders and requests
	 */
	loadAll(): Collection[];

	/**
	 * Create a new collection
	 */
	createCollection(collection: Collection): void;

	/**
	 * Update collection metadata (name, description)
	 */
	updateCollection(id: string, updates: Partial<Collection>): void;

	/**
	 * Delete collection and all nested data (CASCADE)
	 */
	deleteCollection(id: string): void;

	/**
	 * Create a new folder within a collection
	 */
	createFolder(collectionId: string, folder: any): void;

	/**
	 * Update folder metadata
	 */
	updateFolder(folderId: string, updates: Partial<CollectionFolder>): void;

	/**
	 * Delete folder and all nested requests (CASCADE)
	 */
	deleteFolder(folderId: string): void;

	/**
	 * Create a new request
	 */
	createRequest(request: CollectionRequest, collectionId: string): void;

	/**
	 * Update request data
	 */
	updateRequest(requestId: string, updates: Partial<CollectionRequest>): void;

	/**
	 * Delete request
	 */
	deleteRequest(requestId: string): void;

	/**
	 * Clear all collections (for reset scenarios)
	 */
	clearAll(): void;
}
