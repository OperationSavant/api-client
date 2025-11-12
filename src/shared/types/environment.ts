export interface EnvironmentVariable {
	id: string;
	key: string;
	value: string;
	description?: string;
	enabled: boolean;
	type: 'text' | 'secret';
	scope: VariableScope;
	createdAt: Date;
	updatedAt: Date;
}

export type VariableScope = 'global' | 'collection' | 'request';

export interface EnvironmentScope {
	id: string;
	name: string;
	type: VariableScope;
	collectionId?: string; // For collection-scoped variables
	requestId?: string; // For request-scoped variables
	variables: EnvironmentVariable[];
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface VariableResolution {
	original: string;
	resolved: string;
	variables: {
		key: string;
		value: string;
		scope: VariableScope;
	}[];
	unresolved: string[];
}

export interface VariableFilter {
	scope?: VariableScope[];
	enabled?: boolean;
	type?: ('text' | 'secret')[];
	searchTerm?: string;
	collectionId?: string;
}

export interface VariableSort {
	field: 'key' | 'value' | 'type' | 'scope' | 'createdAt' | 'updatedAt';
	direction: 'asc' | 'desc';
}

export interface VariableUsage {
	variableId: string;
	key: string;
	usedIn: {
		type: 'url' | 'header' | 'body' | 'auth' | 'test';
		location: string;
		requestId?: string;
		collectionId?: string;
	}[];
	lastUsed?: Date;
	usageCount: number;
}

export interface VariableValidation {
	isValid: boolean;
	errors: {
		field: 'key' | 'value' | 'scope';
		message: string;
	}[];
	warnings: {
		field: 'key' | 'value' | 'scope';
		message: string;
	}[];
}

export interface VariableExport {
	format: 'json' | 'env' | 'csv';
	scope?: VariableScope[];
	includeSecrets?: boolean;
	timestamp: Date;
}

export interface VariableImport {
	format: 'json' | 'env' | 'csv' | 'postman';
	data: string;
	scope: VariableScope;
	collectionId?: string;
	overwriteExisting?: boolean;
	importSecrets?: boolean;
}

export interface SystemVariable {
	key: string;
	generator: () => string | Promise<string>;
	description: string;
	category: 'random' | 'date' | 'uuid' | 'crypto' | 'system';
	readonly: true;
}

export interface VariableConfiguration {
	maxVariables: number;
	enableSystemVariables: boolean;
	autoComplete: boolean;
	validateReferences: boolean;
	enableEncryption: boolean;
	cacheResolution: boolean;
	maxCacheSize: number;
}
