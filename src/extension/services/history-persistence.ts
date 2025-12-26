import type { Database } from '@vscode/sqlite3';
import type { HistoryItem } from '@/shared/types/history';
import { queryAll, queryOne, runQuery, PreparedStatement, safeJsonParse, safeJsonStringify, PersistenceError } from './db-helpers';
import type { IHistoryPersistence } from '@/domain/types/history-persistence';

export class SQLiteHistoryPersistence implements IHistoryPersistence {
	constructor(private db: Database) {
		// Note: init() is now async, called separately during initialization
	}

	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db.exec(
				`
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        request_headers TEXT,
        request_body TEXT,
        response_status INTEGER,
				response_statusText TEXT,
        response_headers TEXT,
        response_body TEXT,
        timestamp INTEGER NOT NULL,
        success INTEGER NOT NULL,
        duration INTEGER,
        error TEXT,
        collection_id TEXT,
        folder_id TEXT,
        request_size INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
      CREATE INDEX IF NOT EXISTS idx_history_success ON history(success);
    `,
				(err: Error | null) => {
					if (err) {
						reject(new PersistenceError('Failed to initialize history tables', 'init', err));
					} else {
						resolve();
					}
				}
			);
		});
	}

	/**
	 * Load all history items, ordered by timestamp descending
	 * @param limit - Maximum number of items to return (default: 100)
	 */
	async loadAll(limit: number = 100): Promise<HistoryItem[]> {
		const rows = await queryAll(this.db, 'SELECT * FROM history ORDER BY timestamp DESC LIMIT ?', [limit]);

		return rows.map(row => this.rowToHistoryItem(row));
	}

	/**
	 * Load a single history item by ID
	 */
	async loadById(id: string): Promise<HistoryItem | null> {
		const row = await queryOne(this.db, 'SELECT * FROM history WHERE id = ?', [id]);

		if (!row) return null;

		return this.rowToHistoryItem(row);
	}

	/**
	 * Create a new history item
	 */
	async create(item: HistoryItem): Promise<void> {
		const stmt = new PreparedStatement(
			this.db,
			`INSERT INTO history (
        id, method, url, request_headers, request_body,
        response_status, response_statusText, response_headers, response_body,
        timestamp, success, duration, error,
        collection_id, folder_id, request_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		);

		try {
			await stmt.run(
				[
					item.historyId,
					item.request.method,
					item.request.url,
					safeJsonStringify(item.request.headers),
					safeJsonStringify(item.request.body),
					item.response?.status || null,
					item.response?.statusText || null,
					safeJsonStringify(item.response?.headers),
					safeJsonStringify(item.response?.body),
					item.timestamp.getTime(),
					item.success ? 1 : 0,
					item.response?.duration || null,
					item.error || null,
					item.collectionId || null,
					item.folderId || null,
					item.requestSize || null,
				],
				'createHistory'
			);
		} finally {
			stmt.finalize();
		}
	}

	/**
	 * Delete a history item by ID
	 */
	async delete(id: string): Promise<void> {
		await runQuery(this.db, 'DELETE FROM history WHERE id = ?', [id], 'deleteHistory');
	}

	/**
	 * Delete all history items
	 */
	async clearAll(): Promise<void> {
		await runQuery(this.db, 'DELETE FROM history', [], 'clearAllHistory');
	}

	/**
	 * Delete history items older than specified date
	 */
	async deleteOlderThan(date: Date): Promise<void> {
		const cutoffTime = date.getTime();
		await runQuery(this.db, 'DELETE FROM history WHERE timestamp < ?', [cutoffTime], 'deleteOldHistory');
	}

	/**
	 * Get history items filtered by success status
	 */
	async loadByStatus(success: boolean, limit: number = 100): Promise<HistoryItem[]> {
		const rows = await queryAll(this.db, 'SELECT * FROM history WHERE success = ? ORDER BY timestamp DESC LIMIT ?', [success ? 1 : 0, limit]);

		return rows.map(row => this.rowToHistoryItem(row));
	}

	/**
	 * Get history items for a specific URL
	 */
	async loadByUrl(url: string, limit: number = 50): Promise<HistoryItem[]> {
		const rows = await queryAll(this.db, 'SELECT * FROM history WHERE url = ? ORDER BY timestamp DESC LIMIT ?', [url, limit]);

		return rows.map(row => this.rowToHistoryItem(row));
	}

	/**
	 * Get history items for a specific collection
	 */
	async loadByCollection(collectionId: string, limit: number = 100): Promise<HistoryItem[]> {
		const rows = await queryAll(this.db, 'SELECT * FROM history WHERE collection_id = ? ORDER BY timestamp DESC LIMIT ?', [collectionId, limit]);

		return rows.map(row => this.rowToHistoryItem(row));
	}

	/**
	 * Get total count of history items
	 */
	async count(): Promise<number> {
		const row = await queryOne(this.db, 'SELECT COUNT(*) as total FROM history');
		return row?.total || 0;
	}

	/**
	 * Search history items by URL or method
	 */
	async search(searchTerm: string, limit: number = 50): Promise<HistoryItem[]> {
		const searchPattern = `%${searchTerm}%`;
		const rows = await queryAll(this.db, 'SELECT * FROM history WHERE url LIKE ? OR method LIKE ? ORDER BY timestamp DESC LIMIT ?', [
			searchPattern,
			searchPattern,
			limit,
		]);

		return rows.map(row => this.rowToHistoryItem(row));
	}

	/**
	 * Convert database row to HistoryItem
	 */
	private rowToHistoryItem(row: any): HistoryItem {
		return {
			historyId: row.id,
			request: {
				method: row.method,
				url: row.url,
				headers: safeJsonParse(row.request_headers) || {},
				params: {}, // Not stored in history table currently
				body: safeJsonParse(row.request_body) || { type: 'none', content: '' },
				auth: { type: 'none' },
			},
			requestSize: row.request_size || undefined,
			timestamp: new Date(row.timestamp),
			response: row.response_status
				? {
						status: row.response_status,
						statusText: row.response_statusText, // Not stored currently
						headers: safeJsonParse(row.response_headers) || {},
						body: safeJsonParse(row.response_body),
						contentType: row.response_headers
							? safeJsonParse(row.response_headers)?.['Content-Type'] || (safeJsonParse(row.response_headers)?.['content-type'] as string)
							: '',
						size: row.size,
						duration: row.duration || 0,
						isError: row.error ? true : false,
					}
				: undefined,
			collectionId: row.collection_id || undefined,
			folderId: row.folder_id || undefined,
			success: Boolean(row.success),
			error: row.error || undefined,
		};
	}
}
