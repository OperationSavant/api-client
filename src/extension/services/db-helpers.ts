import { Database, Statement } from '@vscode/sqlite3';

/**
 * Custom error types for database persistence operations
 */
export class PersistenceError extends Error {
	constructor(
		message: string,
		public readonly operation: string,
		public readonly cause?: Error
	) {
		super(message);
		this.name = 'PersistenceError';
		// Maintains proper stack trace in V8 engines
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, PersistenceError);
		}
	}
}

export class DuplicateKeyError extends PersistenceError {
	constructor(message: string, operation: string, cause?: Error) {
		super(message, operation, cause);
		this.name = 'DuplicateKeyError';
	}
}

export class ForeignKeyViolationError extends PersistenceError {
	constructor(message: string, operation: string, cause?: Error) {
		super(message, operation, cause);
		this.name = 'ForeignKeyViolationError';
	}
}

export class DatabaseConnectionError extends PersistenceError {
	constructor(message: string, operation: string, cause?: Error) {
		super(message, operation, cause);
		this.name = 'DatabaseConnectionError';
	}
}

/**
 * Transaction wrapper for atomic database operations
 * Ensures all operations complete successfully or roll back together
 */
export class DatabaseTransaction {
	private isActive = false;

	constructor(private db: Database) {}

	/**
	 * Begin a new transaction
	 */
	async begin(): Promise<void> {
		if (this.isActive) {
			throw new PersistenceError('Transaction already active', 'begin');
		}

		return new Promise((resolve, reject) => {
			this.db.run('BEGIN TRANSACTION', (err: Error | null) => {
				if (err) {
					reject(new PersistenceError('Failed to begin transaction', 'begin', err));
				} else {
					this.isActive = true;
					resolve();
				}
			});
		});
	}

	/**
	 * Commit the current transaction
	 */
	async commit(): Promise<void> {
		if (!this.isActive) {
			throw new PersistenceError('No active transaction to commit', 'commit');
		}

		return new Promise((resolve, reject) => {
			this.db.run('COMMIT', (err: Error | null) => {
				if (err) {
					reject(new PersistenceError('Failed to commit transaction', 'commit', err));
				} else {
					this.isActive = false;
					resolve();
				}
			});
		});
	}

	/**
	 * Rollback the current transaction
	 */
	async rollback(): Promise<void> {
		if (!this.isActive) {
			// Silent rollback if no transaction (idempotent)
			return;
		}

		return new Promise((resolve, reject) => {
			this.db.run('ROLLBACK', (err: Error | null) => {
				if (err) {
					// Log but don't reject - rollback should be best-effort
					console.error('Failed to rollback transaction:', err);
				}
				this.isActive = false;
				resolve();
			});
		});
	}

	/**
	 * Execute a function within a transaction context
	 * Automatically commits on success, rolls back on failure
	 */
	async execute<T>(fn: () => Promise<T>): Promise<T> {
		await this.begin();
		try {
			const result = await fn();
			await this.commit();
			return result;
		} catch (error) {
			await this.rollback();
			throw error;
		}
	}
}

/**
 * Promise-based wrapper for Database.all() method
 * Queries database and returns all matching rows
 */
export function queryAll(db: Database, sql: string, params?: any[]): Promise<any[]> {
	return new Promise((resolve, reject) => {
		if (params && params.length > 0) {
			db.all(sql, params, (err: Error | null, rows: any[]) => {
				if (err) {
					reject(new PersistenceError(`Query failed: ${sql}`, 'queryAll', err));
				} else {
					resolve(rows || []);
				}
			});
		} else {
			db.all(sql, (err: Error | null, rows: any[]) => {
				if (err) {
					reject(new PersistenceError(`Query failed: ${sql}`, 'queryAll', err));
				} else {
					resolve(rows || []);
				}
			});
		}
	});
}

/**
 * Promise-based wrapper for Database.get() method
 * Queries database and returns first matching row
 */
export function queryOne(db: Database, sql: string, params?: any[]): Promise<any | undefined> {
	return new Promise((resolve, reject) => {
		if (params && params.length > 0) {
			db.get(sql, params, (err: Error | null, row: any) => {
				if (err) {
					reject(new PersistenceError(`Query failed: ${sql}`, 'queryOne', err));
				} else {
					resolve(row);
				}
			});
		} else {
			db.get(sql, (err: Error | null, row: any) => {
				if (err) {
					reject(new PersistenceError(`Query failed: ${sql}`, 'queryOne', err));
				} else {
					resolve(row);
				}
			});
		}
	});
}

/**
 * Promise-based wrapper for Database.run() method
 * Executes INSERT, UPDATE, DELETE statements
 */
export function runQuery(db: Database, sql: string, params?: any[], operation?: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const callback = (err: Error | null) => {
			if (err) {
				// Map SQLite errors to domain-specific errors
				const errorMessage = err.message || '';

				if (errorMessage.includes('UNIQUE constraint')) {
					reject(new DuplicateKeyError(`Duplicate key constraint violation`, operation || 'runQuery', err));
				} else if (errorMessage.includes('FOREIGN KEY constraint')) {
					reject(new ForeignKeyViolationError(`Foreign key constraint violation`, operation || 'runQuery', err));
				} else {
					reject(new PersistenceError(`Query execution failed: ${sql}`, operation || 'runQuery', err));
				}
			} else {
				resolve();
			}
		};

		if (params && params.length > 0) {
			db.run(sql, params, callback);
		} else {
			db.run(sql, callback);
		}
	});
}

/**
 * Promise-based wrapper for prepared statements
 * Provides type-safe parameter binding
 */
export class PreparedStatement {
	private stmt: Statement;

	constructor(db: Database, sql: string) {
		this.stmt = db.prepare(sql);
	}

	/**
	 * Execute statement with parameters
	 */
	async run(params: any[], operation?: string): Promise<void> {
		return new Promise((resolve, reject) => {
			// Cast to any to access event emitter methods (standard in node-sqlite3/vscode-sqlite3)
			const stmtEmitter = this.stmt as any;
			
			// 1. Safe callback wrapper
			const safeCallback = (err: Error | null) => {
				// Remove error listener to clean up
				if (typeof stmtEmitter.removeListener === 'function') {
					stmtEmitter.removeListener('error', errorHandler);
				}

				try {
					if (err) {
						const errorMessage = err.message || '';

						if (errorMessage.includes('UNIQUE constraint')) {
							reject(new DuplicateKeyError(`Duplicate key constraint violation`, operation || 'PreparedStatement.run', err));
						} else if (errorMessage.includes('FOREIGN KEY constraint')) {
							reject(new ForeignKeyViolationError(`Foreign key constraint violation`, operation || 'PreparedStatement.run', err));
						} else {
							reject(new PersistenceError(`Statement execution failed`, operation || 'PreparedStatement.run', err));
						}
					} else {
						resolve();
					}
				} catch (callbackError) {
					reject(new PersistenceError(`Synchronous error in statement callback`, operation || 'PreparedStatement.run', callbackError as Error));
				}
			};

			// 2. Error event handler for emitted errors (bypassing callback)
			const errorHandler = (err: Error) => {
				if (typeof stmtEmitter.removeListener === 'function') {
					stmtEmitter.removeListener('error', errorHandler);
				}
				reject(new PersistenceError(`Uncaught statement error event`, operation || 'PreparedStatement.run', err));
			};

			// 3. Attach listener if supported
			if (typeof stmtEmitter.on === 'function') {
				stmtEmitter.on('error', errorHandler);
			}

			try {
				this.stmt.run(params, safeCallback);
			} catch (syncError) {
				if (typeof stmtEmitter.removeListener === 'function') {
					stmtEmitter.removeListener('error', errorHandler);
				}
				reject(new PersistenceError(`Statement execution failed (sync error)`, operation || 'PreparedStatement.run', syncError as Error));
			}
		});
	}

	/**
	 * Finalize the prepared statement (cleanup)
	 */
	// db-helpers.ts - Make finalize safe
	finalize(): void {
		try {
			if (this.stmt && typeof this.stmt.finalize === 'function') {
				this.stmt.finalize();
			}
		} catch (error) {
			// Finalize errors should not crash the app
			console.error('PreparedStatement finalize failed:', error);
		}
	}
}

/**
 * Safe JSON parser that handles null/undefined and invalid JSON
 */
export function safeJsonParse(value: any): any {
	if (!value) return undefined;
	if (typeof value === 'object') return value; // Already parsed
	if (typeof value !== 'string') return undefined;

	try {
		return JSON.parse(value);
	} catch {
		console.warn('Invalid JSON detected during parsing:', value);
		return undefined;
	}
}

/**
 * Safe JSON stringifier that handles null/undefined
 */
export function safeJsonStringify(value: any): string | null {
	if (value === undefined || value === null) return null;
	try {
		return JSON.stringify(value);
	} catch {
		console.warn('Failed to stringify value:', value);
		return null;
	}
}
