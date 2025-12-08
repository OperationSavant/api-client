import { AuthConfig } from './auth';
import { RequestBody } from './body';
import { TestSuite } from './testing';

export interface SaveRequestPayload {
	collectionId: string;
	request: Omit<CollectionRequest, 'id'>;
	requestId?: string;
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
	id: string;
	name: string;
	description?: string;
	parentId?: string; // null for root folders
	collapsed?: boolean;
	requests: CollectionRequest[];
	subfolders: CollectionFolder[];
	auth?: AuthConfig; // Inheritable auth
	variables?: Record<string, string>; // Inheritable variables
}

export interface CollectionRequest {
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

// export interface RequestBody {
// 	type: 'none' | 'form-data' | 'url-encoded' | 'raw' | 'binary' | 'graphql';
// 	data: any;
// 	contentType?: string;
// }

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
