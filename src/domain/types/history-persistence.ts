import type { HistoryItem } from '@/shared/types/history';

/**
 * Port interface for history persistence
 * Implementations: SQLite, JSON, In-Memory (for tests)
 */
export interface IHistoryPersistence {
	/**
	 * Initialize storage (create tables, etc.)
	 */
	init(): Promise<void>;

	/**
	 * Load all history items (with optional limit)
	 */
	loadAll(limit?: number): Promise<HistoryItem[]>;

	/**
	 * Load history item by ID
	 */
	loadById(id: string): Promise<HistoryItem | null>;

	/**
	 * Create a new history item
	 */
	create(item: HistoryItem): Promise<void>;

	/**
	 * Delete history item by ID
	 */
	delete(id: string): Promise<void>;

	/**
	 * Clear all history items
	 */
	clearAll(): Promise<void>;

	/**
	 * Delete history items older than specified date
	 */
	deleteOlderThan(date: Date): Promise<void>;

	/**
	 * Load history items by success status
	 */
	loadByStatus(success: boolean, limit?: number): Promise<HistoryItem[]>;

	/**
	 * Load history items by URL pattern
	 */
	loadByUrl(urlPattern: string, limit?: number): Promise<HistoryItem[]>;

	/**
	 * Load history items by collection ID
	 */
	loadByCollection(collectionId: string, limit?: number): Promise<HistoryItem[]>;

	/**
	 * Get total count of history items
	 */
	count(): Promise<number>;

	/**
	 * Search history items
	 */
	search(query: string, limit?: number): Promise<HistoryItem[]>;
}
