import * as sqlite3 from '@vscode/sqlite3'; // Import the whole module
import * as path from 'path';
import * as fs from 'fs';

// Use the verbose mode if desired, otherwise just use sqlite3.Database
const Database = sqlite3.Database;

let dbInstance: sqlite3.Database | null = null;
let dbInitializationPromise: Promise<sqlite3.Database> | null = null;

export function initializeDatabase(dbFilePath: string): Promise<sqlite3.Database> {
	if (dbInitializationPromise) {
		return dbInitializationPromise;
	}

	// Use the Promise to track initialization state
	dbInitializationPromise = new Promise((resolve, reject) => {
		const dbDir = path.dirname(dbFilePath);
		// Use synchronous FS calls here as this runs only once during activation
		if (!fs.existsSync(dbDir)) {
			fs.mkdirSync(dbDir, { recursive: true });
		}

		dbInstance = new Database(dbFilePath, error => {
			if (error) {
				console.error('Failed to connect to the SQLite database:', error.message);
				dbInitializationPromise = null; // Reset promise on failure
				reject(error);
				return;
			}

			// Use .run() within the callback to ensure the DB is open
			dbInstance!.exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`, pragmaError => {
				if (pragmaError) {
					console.error('Failed to set WAL mode:', pragmaError.message);
					reject(pragmaError);
				} else {
					resolve(dbInstance!); // Resolve the Promise once setup is complete
				}
			});
		});
	});

	return dbInitializationPromise;
}

/**
 * Returns the database instance, assuming initializeDatabase has completed successfully.
 * Use this inside functions marked 'async' after awaiting initializeDatabase() during activation.
 */
export function getDatabase(): sqlite3.Database {
	if (!dbInstance) {
		throw new Error('Database not initialized. Ensure initializeDatabase() was awaited.');
	}
	return dbInstance;
}

export function closeDatabase(): void {
	if (dbInstance) {
		dbInstance.close();
		dbInstance = null;
		dbInitializationPromise = null;
	}
}
