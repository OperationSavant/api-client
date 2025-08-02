import { collectionService } from '@/services/collectionService';
import { Collection, CollectionFolder, CollectionRequest } from '@/types/collection';

describe('CollectionService', () => {
	beforeEach(() => {
		// Clear any existing collections before each test
		collectionService.getAllCollections().forEach((collection: Collection) => {
			collectionService.deleteCollection(collection.id);
		});
	});

	describe('Collection CRUD Operations', () => {
		test('should create a new collection', () => {
			const collection = collectionService.createCollection('Test Collection', 'A test collection');

			expect(collection).toBeDefined();
			expect(collection.name).toBe('Test Collection');
			expect(collection.description).toBe('A test collection');
			expect(collection.id).toBeDefined();
			expect(collection.createdAt).toBeInstanceOf(Date);
			expect(collection.updatedAt).toBeInstanceOf(Date);
			expect(collection.folders).toEqual([]);
			expect(collection.requests).toEqual([]);
		});

		test('should retrieve a collection by id', () => {
			const collection = collectionService.createCollection('Test Collection');
			const retrieved = collectionService.getCollection(collection.id);

			expect(retrieved).toEqual(collection);
		});

		test('should return undefined for non-existent collection', () => {
			const retrieved = collectionService.getCollection('non-existent-id');
			expect(retrieved).toBeUndefined();
		});

		test('should get all collections', () => {
			const collection1 = collectionService.createCollection('Collection 1');
			const collection2 = collectionService.createCollection('Collection 2');

			const allCollections = collectionService.getAllCollections();

			expect(allCollections).toHaveLength(2);
			expect(allCollections).toContain(collection1);
			expect(allCollections).toContain(collection2);
		});

		test('should update a collection', () => {
			const collection = collectionService.createCollection('Original Name');
			const originalUpdatedAt = collection.updatedAt;

			// Wait a moment to ensure updatedAt changes
			setTimeout(() => {
				const updated = collectionService.updateCollection(collection.id, {
					name: 'Updated Name',
					description: 'Updated description',
				});

				expect(updated).toBeDefined();
				expect(updated!.name).toBe('Updated Name');
				expect(updated!.description).toBe('Updated description');
				expect(updated!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
			}, 1);
		});

		test('should delete a collection', () => {
			const collection = collectionService.createCollection('To Delete');

			const deleted = collectionService.deleteCollection(collection.id);
			expect(deleted).toBe(true);

			const retrieved = collectionService.getCollection(collection.id);
			expect(retrieved).toBeUndefined();
		});

		test('should return false when deleting non-existent collection', () => {
			const deleted = collectionService.deleteCollection('non-existent-id');
			expect(deleted).toBe(false);
		});
	});

	describe('Folder CRUD Operations', () => {
		let collection: Collection;

		beforeEach(() => {
			collection = collectionService.createCollection('Test Collection');
		});

		test('should create a root folder', () => {
			const folder = collectionService.createFolder(collection.id, 'Test Folder', undefined, 'A test folder');

			expect(folder).toBeDefined();
			expect(folder!.name).toBe('Test Folder');
			expect(folder!.description).toBe('A test folder');
			expect(folder!.parentId).toBeUndefined();
			expect(folder!.collapsed).toBe(false);
			expect(folder!.requests).toEqual([]);
			expect(folder!.subfolders).toEqual([]);

			// Check if folder was added to collection
			const updatedCollection = collectionService.getCollection(collection.id);
			expect(updatedCollection!.folders).toHaveLength(1);
			expect(updatedCollection!.folders[0]).toEqual(folder);
		});

		test('should create a nested folder', () => {
			const parentFolder = collectionService.createFolder(collection.id, 'Parent Folder');
			const childFolder = collectionService.createFolder(collection.id, 'Child Folder', parentFolder!.id);

			expect(childFolder).toBeDefined();
			expect(childFolder!.parentId).toBe(parentFolder!.id);

			// Check if child folder was added to parent
			const updatedCollection = collectionService.getCollection(collection.id);
			const updatedParent = updatedCollection!.folders[0];
			expect(updatedParent.subfolders).toHaveLength(1);
			expect(updatedParent.subfolders[0]).toEqual(childFolder);
		});

		test('should retrieve a folder', () => {
			const folder = collectionService.createFolder(collection.id, 'Test Folder');
			const retrieved = collectionService.getFolder(collection.id, folder!.id);

			expect(retrieved).toEqual(folder);
		});

		test('should update a folder', () => {
			const folder = collectionService.createFolder(collection.id, 'Original Name');

			const updated = collectionService.updateFolder(collection.id, folder!.id, {
				name: 'Updated Name',
				description: 'Updated description',
				collapsed: true,
			});

			expect(updated).toBeDefined();
			expect(updated!.name).toBe('Updated Name');
			expect(updated!.description).toBe('Updated description');
			expect(updated!.collapsed).toBe(true);
		});

		test('should delete a folder', () => {
			const folder = collectionService.createFolder(collection.id, 'To Delete');

			const deleted = collectionService.deleteFolder(collection.id, folder!.id);
			expect(deleted).toBe(true);

			const retrieved = collectionService.getFolder(collection.id, folder!.id);
			expect(retrieved).toBeUndefined();

			// Check if folder was removed from collection
			const updatedCollection = collectionService.getCollection(collection.id);
			expect(updatedCollection!.folders).toHaveLength(0);
		});
	});

	describe('Request CRUD Operations', () => {
		let collection: Collection;

		beforeEach(() => {
			collection = collectionService.createCollection('Test Collection');
		});

		test('should create a root request', () => {
			const requestData = {
				name: 'Test Request',
				method: 'GET',
				url: 'https://api.example.com',
				headers: { 'Content-Type': 'application/json' },
				params: { page: '1' },
				description: 'A test request',
			};

			const request = collectionService.createRequest(collection.id, requestData);

			expect(request).toBeDefined();
			expect(request!.name).toBe('Test Request');
			expect(request!.method).toBe('GET');
			expect(request!.url).toBe('https://api.example.com');
			expect(request!.folderId).toBeUndefined();

			// Check if request was added to collection
			const updatedCollection = collectionService.getCollection(collection.id);
			expect(updatedCollection!.requests).toHaveLength(1);
			expect(updatedCollection!.requests[0]).toEqual(request);
		});

		test('should create a request in a folder', () => {
			const folder = collectionService.createFolder(collection.id, 'Test Folder');
			const requestData = {
				name: 'Test Request',
				method: 'POST',
				url: 'https://api.example.com',
				headers: {},
				params: {},
			};

			const request = collectionService.createRequest(collection.id, requestData, folder!.id);

			expect(request).toBeDefined();
			expect(request!.folderId).toBe(folder!.id);

			// Check if request was added to folder
			const updatedFolder = collectionService.getFolder(collection.id, folder!.id);
			expect(updatedFolder!.requests).toHaveLength(1);
			expect(updatedFolder!.requests[0]).toEqual(request);
		});

		test('should retrieve a request', () => {
			const requestData = {
				name: 'Test Request',
				method: 'GET',
				url: 'https://api.example.com',
				headers: {},
				params: {},
			};

			const request = collectionService.createRequest(collection.id, requestData);
			const retrieved = collectionService.getRequest(collection.id, request!.id);

			expect(retrieved).toEqual(request);
		});

		test('should update a request', () => {
			const requestData = {
				name: 'Original Request',
				method: 'GET',
				url: 'https://api.example.com',
				headers: {},
				params: {},
			};

			const request = collectionService.createRequest(collection.id, requestData);

			const updated = collectionService.updateRequest(collection.id, request!.id, {
				name: 'Updated Request',
				method: 'POST',
				url: 'https://api.updated.com',
			});

			expect(updated).toBeDefined();
			expect(updated!.name).toBe('Updated Request');
			expect(updated!.method).toBe('POST');
			expect(updated!.url).toBe('https://api.updated.com');
		});

		test('should delete a request', () => {
			const requestData = {
				name: 'To Delete',
				method: 'DELETE',
				url: 'https://api.example.com',
				headers: {},
				params: {},
			};

			const request = collectionService.createRequest(collection.id, requestData);

			const deleted = collectionService.deleteRequest(collection.id, request!.id);
			expect(deleted).toBe(true);

			const retrieved = collectionService.getRequest(collection.id, request!.id);
			expect(retrieved).toBeUndefined();

			// Check if request was removed from collection
			const updatedCollection = collectionService.getCollection(collection.id);
			expect(updatedCollection!.requests).toHaveLength(0);
		});
	});

	describe('Tree Operations', () => {
		let collection: Collection;

		beforeEach(() => {
			collection = collectionService.createCollection('Test Collection');
		});

		test('should build collection tree', () => {
			// Create folder structure
			const folder1 = collectionService.createFolder(collection.id, 'Folder 1');
			const folder2 = collectionService.createFolder(collection.id, 'Folder 2', folder1!.id);

			// Create requests
			const rootRequest = collectionService.createRequest(collection.id, {
				name: 'Root Request',
				method: 'GET',
				url: 'https://root.com',
				headers: {},
				params: {},
			});

			const folderRequest = collectionService.createRequest(
				collection.id,
				{
					name: 'Folder Request',
					method: 'POST',
					url: 'https://folder.com',
					headers: {},
					params: {},
				},
				folder1!.id
			);

			const tree = collectionService.getCollectionTree(collection.id);

			expect(tree).toBeDefined();
			expect(tree!.name).toBe('Test Collection');
			expect(tree!.type).toBe('collection');
			expect(tree!.children).toHaveLength(2); // 1 folder + 1 root request

			// Check folder structure
			const folderNode = tree!.children!.find((c: any) => c.type === 'folder');
			expect(folderNode).toBeDefined();
			expect(folderNode!.name).toBe('Folder 1');
			expect(folderNode!.children).toHaveLength(2); // 1 subfolder + 1 request

			// Check root request
			const requestNode = tree!.children!.find((c: any) => c.type === 'request');
			expect(requestNode).toBeDefined();
			expect(requestNode!.name).toBe('Root Request');
			expect(requestNode!.metadata?.method).toBe('GET');
		});

		test('should get collection metadata', () => {
			// Create some content
			collectionService.createFolder(collection.id, 'Folder 1');
			collectionService.createFolder(collection.id, 'Folder 2');
			collectionService.createRequest(collection.id, {
				name: 'Request 1',
				method: 'GET',
				url: 'https://api1.com',
				headers: {},
				params: {},
			});
			collectionService.createRequest(collection.id, {
				name: 'Request 2',
				method: 'POST',
				url: 'https://api2.com',
				headers: {},
				params: {},
			});

			const metadata = collectionService.getCollectionMetadata(collection.id);

			expect(metadata).toBeDefined();
			expect(metadata!.requestCount).toBe(2);
			expect(metadata!.folderCount).toBe(2);
			expect(metadata!.name).toBe('Test Collection');
		});
	});

	describe('Move Operations', () => {
		let collection: Collection;

		beforeEach(() => {
			collection = collectionService.createCollection('Test Collection');
		});

		test('should move request from root to folder', () => {
			const folder = collectionService.createFolder(collection.id, 'Target Folder');
			const request = collectionService.createRequest(collection.id, {
				name: 'Test Request',
				method: 'GET',
				url: 'https://api.com',
				headers: {},
				params: {},
			});

			const moved = collectionService.moveRequest(collection.id, request!.id, folder!.id);
			expect(moved).toBe(true);

			// Check if request is now in folder
			const updatedFolder = collectionService.getFolder(collection.id, folder!.id);
			expect(updatedFolder!.requests).toHaveLength(1);
			expect(updatedFolder!.requests[0].id).toBe(request!.id);

			// Check if request is removed from root
			const updatedCollection = collectionService.getCollection(collection.id);
			expect(updatedCollection!.requests).toHaveLength(0);
		});

		test('should move folder to another folder', () => {
			const parentFolder = collectionService.createFolder(collection.id, 'Parent Folder');
			const childFolder = collectionService.createFolder(collection.id, 'Child Folder');

			const moved = collectionService.moveFolder(collection.id, childFolder!.id, parentFolder!.id);
			expect(moved).toBe(true);

			// Check if child folder is now in parent
			const updatedParent = collectionService.getFolder(collection.id, parentFolder!.id);
			expect(updatedParent!.subfolders).toHaveLength(1);
			expect(updatedParent!.subfolders[0].id).toBe(childFolder!.id);

			// Check if child folder is removed from root
			const updatedCollection = collectionService.getCollection(collection.id);
			expect(updatedCollection!.folders).toHaveLength(1);
			expect(updatedCollection!.folders[0].id).toBe(parentFolder!.id);
		});

		test('should prevent moving folder into itself', () => {
			const folder = collectionService.createFolder(collection.id, 'Test Folder');

			const moved = collectionService.moveFolder(collection.id, folder!.id, folder!.id);
			expect(moved).toBe(false);
		});

		test('should prevent moving folder into its descendant', () => {
			const grandparent = collectionService.createFolder(collection.id, 'Grandparent');
			const parent = collectionService.createFolder(collection.id, 'Parent', grandparent!.id);
			const child = collectionService.createFolder(collection.id, 'Child', parent!.id);

			// Try to move grandparent into child (should fail)
			const moved = collectionService.moveFolder(collection.id, grandparent!.id, child!.id);
			expect(moved).toBe(false);
		});
	});
});

