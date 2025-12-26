import type { Collection, CollectionFolder, CollectionRequest } from '@/shared/types/collection';

/**
 * Port interface for collection persistence
 * Implementations: SQLite, JSON, In-Memory (for tests)
 */
export interface ICollectionPersistence {
	/**
	 * Initialize storage (create tables, etc.)
	 * Returns Promise to support async initialization
	 */
	init(): Promise<void>;

	/**
	 * Load all collections with nested folders and requests
	 */
	loadAll(): Promise<Collection[]>;

	/**
	 * Create a new collection
	 * Returns Promise to ensure write completes before proceeding
	 */
	createCollection(collection: Collection): Promise<void>;

	/**
	 * Update collection metadata (name, description)
	 * Returns Promise to ensure write completes before proceeding
	 */
	updateCollection(id: string, updates: Partial<Collection>): Promise<void>;

	/**
	 * Delete collection and all nested data (CASCADE)
	 * Returns Promise to ensure deletion completes before proceeding
	 */
	deleteCollection(id: string): Promise<void>;

	/**
	 * Create a new folder within a collection
	 * Returns Promise to ensure write completes before proceeding
	 */
	createFolder(collectionId: string, folder: any): Promise<void>;

	/**
	 * Update folder metadata
	 * Returns Promise to ensure write completes before proceeding
	 */
	updateFolder(folderId: string, updates: Partial<CollectionFolder>): Promise<void>;

	/**
	 * Delete folder and all nested requests (CASCADE)
	 * Returns Promise to ensure deletion completes before proceeding
	 */
	deleteFolder(folderId: string): Promise<void>;

	/**
	 * Create a new request
	 * Returns Promise to ensure write completes before proceeding
	 */
	createRequest(request: CollectionRequest, collectionId: string): Promise<void>;

	/**
	 * Update request data
	 * Returns Promise to ensure write completes before proceeding
	 */
	updateRequest(requestId: string, updates: Partial<CollectionRequest>): Promise<void>;

	/**
	 * Delete request
	 * Returns Promise to ensure deletion completes before proceeding
	 */
	deleteRequest(requestId: string): Promise<void>;

	/**
	 * Clear all collections (for reset scenarios)
	 * Returns Promise to ensure all data is cleared before proceeding
	 */
	clearAll(): Promise<void>;
}
