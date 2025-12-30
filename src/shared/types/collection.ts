import type { AuthConfig } from './auth';
import type { RequestBody } from './body';
import type { TestSuite } from './testing';

export interface CreateOrSaveRequest {
	collectionId: string;
	request: Omit<CollectionRequest, 'id'>;
	folderId?: string;
}

export interface UpdateRequest {
	collectionId: string;
	requestId: string;
	updates: Partial<Omit<CollectionRequest, 'id'>>;
}

export interface DeleteRequest {
	collectionId: string;
	requestId: string;
}

export interface CreateCollection {
	name: string;
	description?: string;
}

export interface UpdateCollection {
	id: string;
	updates: Partial<Omit<Collection, 'id' | 'createdAt'>>;
}

export interface DeleteCollection {
	id: string;
}

export interface CreateFolder {
	collectionId: string;
	name: string;
	parentId?: string;
	description?: string;
}

export interface UpdateFolder {
	collectionId: string;
	folderId: string;
	updates: Partial<Omit<CollectionFolder, 'id'>>;
}

export interface DeleteFolder {
	collectionId: string;
	folderId: string;
}

export interface Collection {
	id: string;
	name: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
	folders: CollectionFolder[];
	requests: CollectionRequest[];
	variables?: Record<string, string>;
	auth?: AuthConfig;
}

export interface CollectionFolder {
	collectionId: string;
	id: string;
	name: string;
	description?: string;
	parentId?: string;
	collapsed?: boolean;
	requests: CollectionRequest[];
	subfolders: CollectionFolder[];
	auth?: AuthConfig;
	variables?: Record<string, string>;
}

export interface CollectionRequest {
	collectionId: string;
	id: string;
	name: string;
	description?: string;
	method: string;
	url: string;
	headers: Record<string, string>;
	params: Record<string, string>;
	body?: RequestBody;
	auth?: AuthConfig;
	tests?: TestSuite[];
	folderId?: string;
	operationName?: string;
}

export interface CollectionMetadata {
	id: string;
	name: string;
	description?: string;
	requestCount: number;
	folderCount: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface CollectionTreeNode {
	id: string;
	name: string;
	type: 'collection' | 'folder' | 'request';
	parentId?: string;
	collapsed?: boolean;
	children?: CollectionTreeNode[];
	metadata?: {
		method?: string;
		url?: string;
		description?: string;
	};
}
