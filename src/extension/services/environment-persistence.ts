import { Database } from '@vscode/sqlite3';
import { PersistenceError } from './db-helpers';

export class SQLiteEnvironmentPersistence {
	constructor(private db: Database) {
		// Note: init() is now async, called separately during initialization
	}

	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db.exec(
				`
      CREATE TABLE IF NOT EXISTS environment_scopes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- 'global' | 'collection' | 'request'
        collection_id TEXT,
        request_id TEXT,
        is_active INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS environment_variables (
        id TEXT PRIMARY KEY,
        scope_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        type TEXT DEFAULT 'default', -- 'default' | 'secret'
        enabled INTEGER DEFAULT 1,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (scope_id) REFERENCES environment_scopes(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_env_vars_scope ON environment_variables(scope_id);
      CREATE INDEX IF NOT EXISTS idx_env_vars_key ON environment_variables(key);

    `,
				(err: Error | null) => {
					if (err) {
						reject(new PersistenceError('Failed to initialize environment tables', 'init', err));
					} else {
						resolve();
					}
				}
			);
		});
	}
}
