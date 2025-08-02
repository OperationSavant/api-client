import { CollectionService } from '@/services/collectionService';
import { Collection, CollectionFolder, CollectionRequest } from '@/types/collection';

describe('CollectionService', () => {
	let service: CollectionService;

	beforeEach(() => {
		// Create a fresh instance for each test
		service = CollectionService.getInstance();
		// Clear any existing collections
		service.getAllCollections().forEach(collection => {
			service.deleteCollection(collection.id);
		});
	});

	describe('Collection CRUD Operations', () => {
		test('should create a new collection', () => {
			const collection = service.createCollection('Test Collection', 'A test collection');

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
			const collection = service.createCollection('Test Collection');
			const retrieved = service.getCollection(collection.id);

			expect(retrieved).toEqual(collection);
		});

		test('should return undefined for non-existent collection', () => {
			const retrieved = service.getCollection('non-existent-id');
			expect(retrieved).toBeUndefined();
		});

		test('should get all collections', () => {
			const collection1 = service.createCollection('Collection 1');
			const collection2 = service.createCollection('Collection 2');

			const allCollections = service.getAllCollections();

			expect(allCollections).toHaveLength(2);
			expect(allCollections).toContain(collection1);
			expect(allCollections).toContain(collection2);
		});

		test('should update a collection', () => {
			const collection = service.createCollection('Original Name');
			const originalUpdatedAt = collection.updatedAt;

			// Wait a moment to ensure updatedAt changes
			setTimeout(() => {
				const updated = service.updateCollection(collection.id, {
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
			const collection = service.createCollection('To Delete');

			const deleted = service.deleteCollection(collection.id);
			expect(deleted).toBe(true);

			const retrieved = service.getCollection(collection.id);
			expect(retrieved).toBeUndefined();
		});

		test('should return false when deleting non-existent collection', () => {
			const deleted = service.deleteCollection('non-existent-id');
			expect(deleted).toBe(false);
		});
	});

	describe('Folder CRUD Operations', () => {
		let collection: Collection;

		beforeEach(() => {
			collection = service.createCollection('Test Collection');
		});

		test('should create a root folder', () => {
			const folder = service.createFolder(collection.id, 'Test Folder', undefined, 'A test folder');

			expect(folder).toBeDefined();
			expect(folder!.name).toBe('Test Folder');
			expect(folder!.description).toBe('A test folder');
			expect(folder!.parentId).toBeUndefined();
			expect(folder!.collapsed).toBe(false);
			expect(folder!.requests).toEqual([]);
			expect(folder!.subfolders).toEqual([]);

			// Check if folder was added to collection
			const updatedCollection = service.getCollection(collection.id);
			expect(updatedCollection!.folders).toHaveLength(1);
			expect(updatedCollection!.folders[0]).toEqual(folder);
		});

		test('should create a nested folder', () => {
			const parentFolder = service.createFolder(collection.id, 'Parent Folder');
			const childFolder = service.createFolder(collection.id, 'Child Folder', parentFolder!.id);

			expect(childFolder).toBeDefined();
			expect(childFolder!.parentId).toBe(parentFolder!.id);

			// Check if child folder was added to parent
			const updatedCollection = service.getCollection(collection.id);
			const updatedParent = updatedCollection!.folders[0];
			expect(updatedParent.subfolders).toHaveLength(1);
			expect(updatedParent.subfolders[0]).toEqual(childFolder);
		});

		test('should retrieve a folder', () => {
			const folder = service.createFolder(collection.id, 'Test Folder');
			const retrieved = service.getFolder(collection.id, folder!.id);

			expect(retrieved).toEqual(folder);
		});

		test('should update a folder', () => {
			const folder = service.createFolder(collection.id, 'Original Name');

			const updated = service.updateFolder(collection.id, folder!.id, {
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
			const folder = service.createFolder(collection.id, 'To Delete');

			const deleted = service.deleteFolder(collection.id, folder!.id);
			expect(deleted).toBe(true);

			const retrieved = service.getFolder(collection.id, folder!.id);
			expect(retrieved).toBeUndefined();

			// Check if folder was removed from collection
			const updatedCollection = service.getCollection(collection.id);
			expect(updatedCollection!.folders).toHaveLength(0);
		});
	});

	describe('Request CRUD Operations', () => {
		let collection: Collection;

		beforeEach(() => {
			collection = service.createCollection('Test Collection');
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

			const request = service.createRequest(collection.id, requestData);

			expect(request).toBeDefined();
			expect(request!.name).toBe('Test Request');
			expect(request!.method).toBe('GET');
			expect(request!.url).toBe('https://api.example.com');
			expect(request!.folderId).toBeUndefined();

			// Check if request was added to collection
			const updatedCollection = service.getCollection(collection.id);
			expect(updatedCollection!.requests).toHaveLength(1);
			expect(updatedCollection!.requests[0]).toEqual(request);
		});

		test('should create a request in a folder', () => {
			const folder = service.createFolder(collection.id, 'Test Folder');
			const requestData = {
				name: 'Test Request',
				method: 'POST',
				url: 'https://api.example.com',
				headers: {},
				params: {},
			};

			const request = service.createRequest(collection.id, requestData, folder!.id);

			expect(request).toBeDefined();
			expect(request!.folderId).toBe(folder!.id);

			// Check if request was added to folder
			const updatedFolder = service.getFolder(collection.id, folder!.id);
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

			const request = service.createRequest(collection.id, requestData);
			const retrieved = service.getRequest(collection.id, request!.id);

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

			const request = service.createRequest(collection.id, requestData);

			const updated = service.updateRequest(collection.id, request!.id, {
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

			const request = service.createRequest(collection.id, requestData);

			const deleted = service.deleteRequest(collection.id, request!.id);
			expect(deleted).toBe(true);

			const retrieved = service.getRequest(collection.id, request!.id);
			expect(retrieved).toBeUndefined();

			// Check if request was removed from collection
			const updatedCollection = service.getCollection(collection.id);
			expect(updatedCollection!.requests).toHaveLength(0);
		});
	});

	describe('Tree Operations', () => {
		let collection: Collection;

		beforeEach(() => {
			collection = service.createCollection('Test Collection');
		});

		test('should build collection tree', () => {
			// Create folder structure
			const folder1 = service.createFolder(collection.id, 'Folder 1');
			const folder2 = service.createFolder(collection.id, 'Folder 2', folder1!.id);

			// Create requests
			const rootRequest = service.createRequest(collection.id, {
				name: 'Root Request',
				method: 'GET',
				url: 'https://root.com',
				headers: {},
				params: {},
			});

			const folderRequest = service.createRequest(
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

			const tree = service.getCollectionTree(collection.id);

			expect(tree).toBeDefined();
			expect(tree!.name).toBe('Test Collection');
			expect(tree!.type).toBe('collection');
			expect(tree!.children).toHaveLength(2); // 1 folder + 1 root request

			// Check folder structure
			const folderNode = tree!.children!.find(c => c.type === 'folder');
			expect(folderNode).toBeDefined();
			expect(folderNode!.name).toBe('Folder 1');
			expect(folderNode!.children).toHaveLength(2); // 1 subfolder + 1 request

			// Check root request
			const requestNode = tree!.children!.find(c => c.type === 'request');
			expect(requestNode).toBeDefined();
			expect(requestNode!.name).toBe('Root Request');
			expect(requestNode!.metadata?.method).toBe('GET');
		});

		test('should get collection metadata', () => {
			// Create some content
			service.createFolder(collection.id, 'Folder 1');
			service.createFolder(collection.id, 'Folder 2');
			service.createRequest(collection.id, {
				name: 'Request 1',
				method: 'GET',
				url: 'https://api1.com',
				headers: {},
				params: {},
			});
			service.createRequest(collection.id, {
				name: 'Request 2',
				method: 'POST',
				url: 'https://api2.com',
				headers: {},
				params: {},
			});

			const metadata = service.getCollectionMetadata(collection.id);

			expect(metadata).toBeDefined();
			expect(metadata!.requestCount).toBe(2);
			expect(metadata!.folderCount).toBe(2);
			expect(metadata!.name).toBe('Test Collection');
		});
	});

	describe('Move Operations', () => {
		let collection: Collection;

		beforeEach(() => {
			collection = service.createCollection('Test Collection');
		});

		test('should move request from root to folder', () => {
			const folder = service.createFolder(collection.id, 'Target Folder');
			const request = service.createRequest(collection.id, {
				name: 'Test Request',
				method: 'GET',
				url: 'https://api.com',
				headers: {},
				params: {},
			});

			const moved = service.moveRequest(collection.id, request!.id, folder!.id);
			expect(moved).toBe(true);

			// Check if request is now in folder
			const updatedFolder = service.getFolder(collection.id, folder!.id);
			expect(updatedFolder!.requests).toHaveLength(1);
			expect(updatedFolder!.requests[0].id).toBe(request!.id);

			// Check if request is removed from root
			const updatedCollection = service.getCollection(collection.id);
			expect(updatedCollection!.requests).toHaveLength(0);
		});

		test('should move folder to another folder', () => {
			const parentFolder = service.createFolder(collection.id, 'Parent Folder');
			const childFolder = service.createFolder(collection.id, 'Child Folder');

			const moved = service.moveFolder(collection.id, childFolder!.id, parentFolder!.id);
			expect(moved).toBe(true);

			// Check if child folder is now in parent
			const updatedParent = service.getFolder(collection.id, parentFolder!.id);
			expect(updatedParent!.subfolders).toHaveLength(1);
			expect(updatedParent!.subfolders[0].id).toBe(childFolder!.id);

			// Check if child folder is removed from root
			const updatedCollection = service.getCollection(collection.id);
			expect(updatedCollection!.folders).toHaveLength(1);
			expect(updatedCollection!.folders[0].id).toBe(parentFolder!.id);
		});

		test('should prevent moving folder into itself', () => {
			const folder = service.createFolder(collection.id, 'Test Folder');

			const moved = service.moveFolder(collection.id, folder!.id, folder!.id);
			expect(moved).toBe(false);
		});

		test('should prevent moving folder into its descendant', () => {
			const grandparent = service.createFolder(collection.id, 'Grandparent');
			const parent = service.createFolder(collection.id, 'Parent', grandparent!.id);
			const child = service.createFolder(collection.id, 'Child', parent!.id);

			// Try to move grandparent into child (should fail)
			const moved = service.moveFolder(collection.id, grandparent!.id, child!.id);
			expect(moved).toBe(false);
		});
	});
});
