import { Database } from '@vscode/sqlite3';
import { ICollectionPersistence } from '@/domain/types/collection-persistence';
import { Collection, CollectionFolder, CollectionRequest } from '@/shared/types/collection';

export class SQLiteCollectionPersistence implements ICollectionPersistence {
	constructor(private db: Database) {
		this.init();
	}

	init(): void {
		this.db.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        variables TEXT,
        auth TEXT
      );

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        parent_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        collapsed INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        variables TEXT,
        auth TEXT,
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        folder_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        headers TEXT NOT NULL,
        params TEXT NOT NULL,
        body TEXT,
        auth TEXT,
        tests TEXT,
        operation_name TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_folders_collection ON folders(collection_id);
      CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
      CREATE INDEX IF NOT EXISTS idx_requests_collection ON requests(collection_id);
      CREATE INDEX IF NOT EXISTS idx_requests_folder ON requests(folder_id);
    `);
	}

	loadAll(): Collection[] {
		const collectionsRows = this.db.prepare('SELECT * FROM collections').all();
		const foldersRows = this.db.prepare('SELECT * FROM folders').all();
		const requestsRows = this.db.prepare('SELECT * FROM requests').all();

		// Build folder map
		const folderMap = new Map<string, CollectionFolder>();
		foldersRows.each((err, row) => {
			folderMap.set(row.id, {
				id: row.id,
				name: row.name,
				description: row.description || undefined,
				parentId: row.parent_id || undefined,
				collapsed: Boolean(row.collapsed),
				requests: [],
				subfolders: [],
				variables: row.variables ? JSON.parse(row.variables) : undefined,
				auth: row.auth ? JSON.parse(row.auth) : undefined,
			});
		});

		// Build folder tree (n-depth)
		const rootFoldersByCollection = new Map<string, CollectionFolder[]>();
		foldersRows.each((err, row) => {
			const folder = folderMap.get(row.id)!;

			if (row.parent_id) {
				// Nested folder - attach to parent's subfolders
				const parent = folderMap.get(row.parent_id);
				if (parent) {
					parent.subfolders.push(folder);
				}
			} else {
				// Root folder - attach to collection
				if (!rootFoldersByCollection.has(row.collection_id)) {
					rootFoldersByCollection.set(row.collection_id, []);
				}
				rootFoldersByCollection.get(row.collection_id)!.push(folder);
			}
		});

		// Attach requests to folders or collections
		const requestsByCollection = new Map<string, CollectionRequest[]>();
		requestsRows.each((err, row) => {
			const request: CollectionRequest = {
				id: row.id,
				name: row.name,
				description: row.description || undefined,
				method: row.method,
				url: row.url,
				headers: JSON.parse(row.headers),
				params: JSON.parse(row.params),
				body: row.body ? JSON.parse(row.body) : undefined,
				auth: row.auth ? JSON.parse(row.auth) : undefined,
				tests: row.tests ? JSON.parse(row.tests) : undefined,
				folderId: row.folder_id || undefined,
				operationName: row.operation_name || undefined,
			};

			if (row.folder_id) {
				// Request inside folder
				const folder = folderMap.get(row.folder_id);
				if (folder) {
					folder.requests.push(request);
				}
			} else {
				// Request at collection root
				if (!requestsByCollection.has(row.collection_id)) {
					requestsByCollection.set(row.collection_id, []);
				}
				requestsByCollection.get(row.collection_id)!.push(request);
			}
		});

		// Build collections
		const collections: Collection[] = [];
		collectionsRows.each((err, row) => {
			collections.push({
				id: row.id,
				name: row.name,
				description: row.description || undefined,
				createdAt: new Date(row.created_at),
				updatedAt: new Date(row.updated_at),
				folders: rootFoldersByCollection.get(row.id) || [],
				requests: requestsByCollection.get(row.id) || [],
				variables: row.variables ? JSON.parse(row.variables) : undefined,
				auth: row.auth ? JSON.parse(row.auth) : undefined,
			});
		});
		return collections;
	}

	createCollection(collection: Collection): void {
		const stmt = this.db.prepare(`
      INSERT INTO collections (id, name, description, created_at, updated_at, variables, auth)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

		stmt.run(
			collection.id,
			collection.name,
			collection.description || null,
			collection.createdAt.getTime(),
			collection.updatedAt.getTime(),
			collection.variables ? JSON.stringify(collection.variables) : null,
			collection.auth ? JSON.stringify(collection.auth) : null
		);
	}

	updateCollection(id: string, updates: Partial<Collection>): void {
		const fields: string[] = [];
		const values: any[] = [];

		if (updates.name !== undefined) {
			fields.push('name = ?');
			values.push(updates.name);
		}
		if (updates.description !== undefined) {
			fields.push('description = ?');
			values.push(updates.description);
		}
		if (updates.variables !== undefined) {
			fields.push('variables = ?');
			values.push(JSON.stringify(updates.variables));
		}
		if (updates.auth !== undefined) {
			fields.push('auth = ?');
			values.push(JSON.stringify(updates.auth));
		}

		if (fields.length === 0) return;

		fields.push('updated_at = ?');
		values.push(Date.now());
		values.push(id);

		const stmt = this.db.prepare(`UPDATE collections SET ${fields.join(', ')} WHERE id = ?`);

		stmt.run(...values);
	}

	deleteCollection(id: string): void {
		const stmt = this.db.prepare('DELETE FROM collections WHERE id = ?');

		stmt.run(id);
	}

	createFolder(collectionId: string, folder: CollectionFolder): void {
		const stmt = this.db.prepare(`
      INSERT INTO folders (id, collection_id, parent_id, name, description, collapsed, created_at, updated_at, variables, auth)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

		stmt.run(
			folder.id,
			collectionId,
			folder.parentId || null,
			folder.name,
			folder.description || null,
			folder.collapsed ? 1 : 0,
			Date.now(),
			Date.now(),
			folder.variables ? JSON.stringify(folder.variables) : null,
			folder.auth ? JSON.stringify(folder.auth) : null
		);
	}

	updateFolder(folderId: string, updates: Partial<CollectionFolder>): void {
		const fields: string[] = [];
		const values: any[] = [];

		if (updates.name !== undefined) {
			fields.push('name = ?');
			values.push(updates.name);
		}
		if (updates.description !== undefined) {
			fields.push('description = ?');
			values.push(updates.description);
		}
		if (updates.collapsed !== undefined) {
			fields.push('collapsed = ?');
			values.push(updates.collapsed ? 1 : 0);
		}
		if (updates.parentId !== undefined) {
			fields.push('parent_id = ?');
			values.push(updates.parentId);
		}
		if (updates.variables !== undefined) {
			fields.push('variables = ?');
			values.push(JSON.stringify(updates.variables));
		}
		if (updates.auth !== undefined) {
			fields.push('auth = ?');
			values.push(JSON.stringify(updates.auth));
		}

		if (fields.length === 0) return;

		fields.push('updated_at = ?');
		values.push(Date.now());
		values.push(folderId);

		const stmt = this.db.prepare(`UPDATE folders SET ${fields.join(', ')} WHERE id = ?`);

		stmt.run(...values);
	}

	deleteFolder(folderId: string): void {
		const stmt = this.db.prepare('DELETE FROM folders WHERE id = ?');
		stmt.run(folderId);
	}

	createRequest(request: CollectionRequest, collectionId: string): void {
		const stmt = this.db.prepare(`
      INSERT INTO requests (
        id, collection_id, folder_id, name, description, method, url,
        headers, params, body, auth, tests, operation_name, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

		stmt.run(
			request.id,
			collectionId,
			request.folderId || null,
			request.name,
			request.description || null,
			request.method,
			request.url,
			JSON.stringify(request.headers),
			JSON.stringify(request.params),
			request.body ? JSON.stringify(request.body) : null,
			request.auth ? JSON.stringify(request.auth) : null,
			request.tests ? JSON.stringify(request.tests) : null,
			request.operationName || null,
			Date.now(),
			Date.now()
		);
	}

	updateRequest(requestId: string, updates: Partial<CollectionRequest>): void {
		const fields: string[] = [];
		const values: any[] = [];

		if (updates.name !== undefined) {
			fields.push('name = ?');
			values.push(updates.name);
		}
		if (updates.description !== undefined) {
			fields.push('description = ?');
			values.push(updates.description);
		}
		if (updates.method !== undefined) {
			fields.push('method = ?');
			values.push(updates.method);
		}
		if (updates.url !== undefined) {
			fields.push('url = ?');
			values.push(updates.url);
		}
		if (updates.headers !== undefined) {
			fields.push('headers = ?');
			values.push(JSON.stringify(updates.headers));
		}
		if (updates.params !== undefined) {
			fields.push('params = ?');
			values.push(JSON.stringify(updates.params));
		}
		if (updates.body !== undefined) {
			fields.push('body = ?');
			values.push(JSON.stringify(updates.body));
		}
		if (updates.auth !== undefined) {
			fields.push('auth = ?');
			values.push(JSON.stringify(updates.auth));
		}
		if (updates.tests !== undefined) {
			fields.push('tests = ?');
			values.push(JSON.stringify(updates.tests));
		}
		if (updates.folderId !== undefined) {
			fields.push('folder_id = ?');
			values.push(updates.folderId);
		}
		if (updates.operationName !== undefined) {
			fields.push('operation_name = ?');
			values.push(updates.operationName);
		}

		if (fields.length === 0) return;

		fields.push('updated_at = ?');
		values.push(Date.now());
		values.push(requestId);

		const stmt = this.db.prepare(`UPDATE requests SET ${fields.join(', ')} WHERE id = ?`);

		stmt.run(...values);
	}

	deleteRequest(requestId: string): void {
		const stmt = this.db.prepare('DELETE FROM requests WHERE id = ?');

		stmt.run(requestId);
	}

	clearAll(): void {
		this.db.prepare('DELETE FROM collections').run();
	}
}
