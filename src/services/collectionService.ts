import { Collection, CollectionFolder, CollectionRequest, CollectionMetadata, CollectionTreeNode } from '@/types/collection';
import { AuthConfig } from '@/types/auth';
import { TestSuite } from '@/types/testing';

export class CollectionService {
	private static instance: CollectionService;
	private collections: Map<string, Collection> = new Map();

	static getInstance(): CollectionService {
		if (!CollectionService.instance) {
			CollectionService.instance = new CollectionService();
		}
		return CollectionService.instance;
	}

	// Collection CRUD Operations
	createCollection(name: string, description?: string): Collection {
		const collection: Collection = {
			id: this.generateId(),
			name,
			description,
			createdAt: new Date(),
			updatedAt: new Date(),
			folders: [],
			requests: [],
		};

		this.collections.set(collection.id, collection);
		return collection;
	}

	getCollection(id: string): Collection | undefined {
		return this.collections.get(id);
	}

	getAllCollections(): Collection[] {
		return Array.from(this.collections.values());
	}

	updateCollection(id: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>): Collection | undefined {
		const collection = this.collections.get(id);
		if (!collection) return undefined;

		const updatedCollection = {
			...collection,
			...updates,
			updatedAt: new Date(),
		};

		this.collections.set(id, updatedCollection);
		return updatedCollection;
	}

	deleteCollection(id: string): boolean {
		return this.collections.delete(id);
	}

	// Folder CRUD Operations
	createFolder(collectionId: string, name: string, parentId?: string, description?: string): CollectionFolder | undefined {
		const collection = this.collections.get(collectionId);
		if (!collection) return undefined;

		const folder: CollectionFolder = {
			id: this.generateId(),
			name,
			description,
			parentId,
			collapsed: false,
			requests: [],
			subfolders: [],
		};

		if (parentId) {
			const parentFolder = this.findFolder(collection, parentId);
			if (parentFolder) {
				parentFolder.subfolders.push(folder);
			}
		} else {
			collection.folders.push(folder);
		}

		collection.updatedAt = new Date();
		return folder;
	}

	getFolder(collectionId: string, folderId: string): CollectionFolder | undefined {
		const collection = this.collections.get(collectionId);
		if (!collection) return undefined;

		return this.findFolder(collection, folderId);
	}

	updateFolder(collectionId: string, folderId: string, updates: Partial<Omit<CollectionFolder, 'id'>>): CollectionFolder | undefined {
		const collection = this.collections.get(collectionId);
		if (!collection) return undefined;

		const folder = this.findFolder(collection, folderId);
		if (!folder) return undefined;

		Object.assign(folder, updates);
		collection.updatedAt = new Date();
		return folder;
	}

	deleteFolder(collectionId: string, folderId: string): boolean {
		const collection = this.collections.get(collectionId);
		if (!collection) return false;

		// Remove from parent folder or root
		const folder = this.findFolder(collection, folderId);
		if (!folder) return false;

		if (folder.parentId) {
			const parentFolder = this.findFolder(collection, folder.parentId);
			if (parentFolder) {
				parentFolder.subfolders = parentFolder.subfolders.filter(f => f.id !== folderId);
			}
		} else {
			collection.folders = collection.folders.filter(f => f.id !== folderId);
		}

		collection.updatedAt = new Date();
		return true;
	}

	// Request CRUD Operations
	createRequest(collectionId: string, request: Omit<CollectionRequest, 'id'>, folderId?: string): CollectionRequest | undefined {
		const collection = this.collections.get(collectionId);
		if (!collection) return undefined;

		const newRequest: CollectionRequest = {
			...request,
			id: this.generateId(),
			folderId,
		};

		if (folderId) {
			const folder = this.findFolder(collection, folderId);
			if (folder) {
				folder.requests.push(newRequest);
			}
		} else {
			collection.requests.push(newRequest);
		}

		collection.updatedAt = new Date();
		return newRequest;
	}

	getRequest(collectionId: string, requestId: string): CollectionRequest | undefined {
		const collection = this.collections.get(collectionId);
		if (!collection) return undefined;

		return this.findRequest(collection, requestId);
	}

	updateRequest(collectionId: string, requestId: string, updates: Partial<Omit<CollectionRequest, 'id'>>): CollectionRequest | undefined {
		const collection = this.collections.get(collectionId);
		if (!collection) return undefined;

		const request = this.findRequest(collection, requestId);
		if (!request) return undefined;

		Object.assign(request, updates);
		collection.updatedAt = new Date();
		return request;
	}

	deleteRequest(collectionId: string, requestId: string): boolean {
		const collection = this.collections.get(collectionId);
		if (!collection) return false;

		const request = this.findRequest(collection, requestId);
		if (!request) return false;

		if (request.folderId) {
			const folder = this.findFolder(collection, request.folderId);
			if (folder) {
				folder.requests = folder.requests.filter(r => r.id !== requestId);
			}
		} else {
			collection.requests = collection.requests.filter(r => r.id !== requestId);
		}

		collection.updatedAt = new Date();
		return true;
	}

	// Tree View Operations
	getCollectionTree(collectionId: string): CollectionTreeNode | undefined {
		const collection = this.collections.get(collectionId);
		if (!collection) return undefined;

		const rootNode: CollectionTreeNode = {
			id: collection.id,
			name: collection.name,
			type: 'collection',
			children: [],
		};

		// Add root folders
		rootNode.children!.push(...collection.folders.map(folder => this.buildFolderTree(folder)));

		// Add root requests
		rootNode.children!.push(
			...collection.requests.map(request => ({
				id: request.id,
				name: request.name,
				type: 'request' as const,
				parentId: collection.id,
				metadata: {
					method: request.method,
					url: request.url,
					description: request.description,
				},
			}))
		);

		return rootNode;
	}

	getCollectionMetadata(collectionId: string): CollectionMetadata | undefined {
		const collection = this.collections.get(collectionId);
		if (!collection) return undefined;

		const requestCount = this.countRequests(collection);
		const folderCount = this.countFolders(collection);

		return {
			id: collection.id,
			name: collection.name,
			description: collection.description,
			requestCount,
			folderCount,
			createdAt: collection.createdAt,
			updatedAt: collection.updatedAt,
		};
	}

	// Move Operations
	moveRequest(collectionId: string, requestId: string, targetFolderId?: string): boolean {
		const collection = this.collections.get(collectionId);
		if (!collection) return false;

		const request = this.findRequest(collection, requestId);
		if (!request) return false;

		// Remove from current location
		this.deleteRequest(collectionId, requestId);

		// Add to new location
		request.folderId = targetFolderId;
		if (targetFolderId) {
			const folder = this.findFolder(collection, targetFolderId);
			if (folder) {
				folder.requests.push(request);
			}
		} else {
			collection.requests.push(request);
		}

		collection.updatedAt = new Date();
		return true;
	}

	moveFolder(collectionId: string, folderId: string, targetParentId?: string): boolean {
		const collection = this.collections.get(collectionId);
		if (!collection) return false;

		const folder = this.findFolder(collection, folderId);
		if (!folder) return false;

		// Prevent moving folder into itself or its descendants
		if (targetParentId && this.isFolderDescendant(collection, targetParentId, folderId)) {
			return false;
		}

		// Remove from current location
		this.deleteFolder(collectionId, folderId);

		// Add to new location
		folder.parentId = targetParentId;
		if (targetParentId) {
			const parentFolder = this.findFolder(collection, targetParentId);
			if (parentFolder) {
				parentFolder.subfolders.push(folder);
			}
		} else {
			collection.folders.push(folder);
		}

		collection.updatedAt = new Date();
		return true;
	}

	// Helper Methods
	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private findFolder(collection: Collection, folderId: string): CollectionFolder | undefined {
		const findInFolders = (folders: CollectionFolder[]): CollectionFolder | undefined => {
			for (const folder of folders) {
				if (folder.id === folderId) return folder;
				const found = findInFolders(folder.subfolders);
				if (found) return found;
			}
			return undefined;
		};

		return findInFolders(collection.folders);
	}

	private findRequest(collection: Collection, requestId: string): CollectionRequest | undefined {
		// Check root requests
		const rootRequest = collection.requests.find(r => r.id === requestId);
		if (rootRequest) return rootRequest;

		// Check folder requests
		const findInFolders = (folders: CollectionFolder[]): CollectionRequest | undefined => {
			for (const folder of folders) {
				const folderRequest = folder.requests.find(r => r.id === requestId);
				if (folderRequest) return folderRequest;
				const found = findInFolders(folder.subfolders);
				if (found) return found;
			}
			return undefined;
		};

		return findInFolders(collection.folders);
	}

	private buildFolderTree(folder: CollectionFolder): CollectionTreeNode {
		const node: CollectionTreeNode = {
			id: folder.id,
			name: folder.name,
			type: 'folder',
			parentId: folder.parentId,
			collapsed: folder.collapsed,
			children: [],
		};

		// Add subfolders
		node.children!.push(...folder.subfolders.map(subfolder => this.buildFolderTree(subfolder)));

		// Add requests
		node.children!.push(
			...folder.requests.map(request => ({
				id: request.id,
				name: request.name,
				type: 'request' as const,
				parentId: folder.id,
				metadata: {
					method: request.method,
					url: request.url,
					description: request.description,
				},
			}))
		);

		return node;
	}

	private countRequests(collection: Collection): number {
		const count = collection.requests.length;

		const countInFolders = (folders: CollectionFolder[]): number => {
			return folders.reduce((acc, folder) => {
				return acc + folder.requests.length + countInFolders(folder.subfolders);
			}, 0);
		};

		return count + countInFolders(collection.folders);
	}

	private countFolders(collection: Collection): number {
		const countRecursive = (folders: CollectionFolder[]): number => {
			return folders.reduce((acc, folder) => {
				return acc + 1 + countRecursive(folder.subfolders);
			}, 0);
		};

		return countRecursive(collection.folders);
	}

	private isFolderDescendant(collection: Collection, ancestorId: string, descendantId: string): boolean {
		const ancestor = this.findFolder(collection, ancestorId);
		if (!ancestor) return false;

		const checkDescendants = (folders: CollectionFolder[]): boolean => {
			for (const folder of folders) {
				if (folder.id === descendantId) return true;
				if (checkDescendants(folder.subfolders)) return true;
			}
			return false;
		};

		return checkDescendants(ancestor.subfolders);
	}

	// Data persistence methods (to be implemented later)
	async saveToStorage(): Promise<void> {
		// TODO: Implement storage persistence
	}

	async loadFromStorage(): Promise<void> {
		// TODO: Implement storage loading
	}
}

export const collectionService = CollectionService.getInstance();
