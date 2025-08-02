import {
	EnvironmentVariable,
	EnvironmentScope,
	VariableScope,
	VariableFilter,
	VariableSort,
	VariableResolution,
	VariableUsage,
	VariableValidation,
	VariableExport,
	VariableImport,
	SystemVariable,
	VariableConfiguration,
} from '@/types/environment';

class EnvironmentService {
	private scopes: Map<string, EnvironmentScope> = new Map();
	private activeScope: string | null = null;
	private systemVariables: Map<string, SystemVariable> = new Map();
	private config: VariableConfiguration = {
		maxVariables: 500,
		enableSystemVariables: true,
		autoComplete: true,
		validateReferences: true,
		enableEncryption: true,
		cacheResolution: true,
		maxCacheSize: 100,
	};
	private resolutionCache: Map<string, VariableResolution> = new Map();

	constructor() {
		this.loadFromStorage();
		this.initializeSystemVariables();
	}

	// Scope Management
	createScope(name: string, type: VariableScope, collectionId?: string, requestId?: string): EnvironmentScope {
		const scope: EnvironmentScope = {
			id: this.generateId(),
			name,
			type,
			collectionId,
			requestId,
			variables: [],
			isActive: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.scopes.set(scope.id, scope);
		this.saveToStorage();
		return scope;
	}

	getScope(id: string): EnvironmentScope | undefined {
		return this.scopes.get(id);
	}

	getScopes(type?: VariableScope, collectionId?: string): EnvironmentScope[] {
		return Array.from(this.scopes.values()).filter(scope => {
			if (type && scope.type !== type) return false;
			if (collectionId && scope.collectionId !== collectionId) return false;
			return true;
		});
	}

	updateScope(id: string, updates: Partial<EnvironmentScope>): boolean {
		const scope = this.scopes.get(id);
		if (!scope) return false;

		Object.assign(scope, updates, { updatedAt: new Date() });
		this.scopes.set(id, scope);
		this.clearResolutionCache();
		this.saveToStorage();
		return true;
	}

	deleteScope(id: string): boolean {
		const deleted = this.scopes.delete(id);
		if (deleted) {
			if (this.activeScope === id) {
				this.activeScope = null;
			}
			this.clearResolutionCache();
			this.saveToStorage();
		}
		return deleted;
	}

	setActiveScope(id: string): boolean {
		const scope = this.scopes.get(id);
		if (!scope) return false;

		// Deactivate current active scope
		if (this.activeScope) {
			const currentScope = this.scopes.get(this.activeScope);
			if (currentScope) {
				currentScope.isActive = false;
			}
		}

		// Activate new scope
		scope.isActive = true;
		this.activeScope = id;
		this.clearResolutionCache();
		this.saveToStorage();
		return true;
	}

	getActiveScope(): EnvironmentScope | null {
		return this.activeScope ? this.scopes.get(this.activeScope) || null : null;
	}

	// Variable Management
	addVariable(scopeId: string, variable: Omit<EnvironmentVariable, 'id' | 'createdAt' | 'updatedAt'>): EnvironmentVariable | null {
		const scope = this.scopes.get(scopeId);
		if (!scope) return null;

		// Validate variable
		const validation = this.validateVariable(variable);
		if (!validation.isValid) {
			throw new Error(validation.errors.map(e => e.message).join(', '));
		}

		// Check for duplicate keys in the same scope
		const existingVariable = scope.variables.find(v => v.key === variable.key);
		if (existingVariable) {
			throw new Error(`Variable with key '${variable.key}' already exists in this scope`);
		}

		const newVariable: EnvironmentVariable = {
			...variable,
			id: this.generateId(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		scope.variables.push(newVariable);
		scope.updatedAt = new Date();
		this.clearResolutionCache();
		this.saveToStorage();
		return newVariable;
	}

	getVariable(scopeId: string, variableId: string): EnvironmentVariable | undefined {
		const scope = this.scopes.get(scopeId);
		return scope?.variables.find(v => v.id === variableId);
	}

	getVariables(filter?: VariableFilter, sort?: VariableSort): EnvironmentVariable[] {
		let allVariables: EnvironmentVariable[] = [];

		// Collect variables from all scopes
		for (const scope of this.scopes.values()) {
			for (const variable of scope.variables) {
				allVariables.push({ ...variable, scope: scope.type });
			}
		}

		// Apply filters
		if (filter) {
			if (filter.scope && filter.scope.length > 0) {
				allVariables = allVariables.filter(v => filter.scope!.includes(v.scope));
			}
			if (filter.enabled !== undefined) {
				allVariables = allVariables.filter(v => v.enabled === filter.enabled);
			}
			if (filter.type && filter.type.length > 0) {
				allVariables = allVariables.filter(v => filter.type!.includes(v.type));
			}
			if (filter.searchTerm) {
				const term = filter.searchTerm.toLowerCase();
				allVariables = allVariables.filter(
					v => v.key.toLowerCase().includes(term) || v.value.toLowerCase().includes(term) || (v.description && v.description.toLowerCase().includes(term))
				);
			}
			if (filter.collectionId) {
				const collectionScopes = Array.from(this.scopes.values())
					.filter(s => s.collectionId === filter.collectionId)
					.map(s => s.id);
				allVariables = allVariables.filter(v => {
					const scopeId = this.findVariableScope(v.id);
					return scopeId && collectionScopes.includes(scopeId);
				});
			}
		}

		// Apply sorting
		if (sort) {
			allVariables.sort((a, b) => {
				let aValue: any = a[sort.field];
				let bValue: any = b[sort.field];

				if (sort.field === 'createdAt' || sort.field === 'updatedAt') {
					aValue = new Date(aValue).getTime();
					bValue = new Date(bValue).getTime();
				} else if (typeof aValue === 'string') {
					aValue = aValue.toLowerCase();
					bValue = bValue.toLowerCase();
				}

				if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
				if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
				return 0;
			});
		}

		return allVariables;
	}

	updateVariable(scopeId: string, variableId: string, updates: Partial<EnvironmentVariable>): boolean {
		const scope = this.scopes.get(scopeId);
		if (!scope) return false;

		const variableIndex = scope.variables.findIndex(v => v.id === variableId);
		if (variableIndex === -1) return false;

		const variable = scope.variables[variableIndex];

		// Validate updates
		const updatedVariable = { ...variable, ...updates };
		const validation = this.validateVariable(updatedVariable);
		if (!validation.isValid) {
			throw new Error(validation.errors.map(e => e.message).join(', '));
		}

		// Check for duplicate keys if key is being updated
		if (updates.key && updates.key !== variable.key) {
			const existingVariable = scope.variables.find(v => v.key === updates.key && v.id !== variableId);
			if (existingVariable) {
				throw new Error(`Variable with key '${updates.key}' already exists in this scope`);
			}
		}

		Object.assign(variable, updates, { updatedAt: new Date() });
		scope.updatedAt = new Date();
		this.clearResolutionCache();
		this.saveToStorage();
		return true;
	}

	deleteVariable(scopeId: string, variableId: string): boolean {
		const scope = this.scopes.get(scopeId);
		if (!scope) return false;

		const initialLength = scope.variables.length;
		scope.variables = scope.variables.filter(v => v.id !== variableId);

		if (scope.variables.length < initialLength) {
			scope.updatedAt = new Date();
			this.clearResolutionCache();
			this.saveToStorage();
			return true;
		}
		return false;
	}

	// Variable Resolution
	resolveString(input: string, contextScope?: VariableScope, collectionId?: string, requestId?: string): VariableResolution {
		const cacheKey = `${input}:${contextScope}:${collectionId}:${requestId}`;

		if (this.config.cacheResolution && this.resolutionCache.has(cacheKey)) {
			return this.resolutionCache.get(cacheKey)!;
		}

		const resolution: VariableResolution = {
			original: input,
			resolved: input,
			variables: [],
			unresolved: [],
		};

		// Find all variable references in the format {{variableName}}
		const variableRegex = /\{\{([^}]+)\}\}/g;
		let match;

		while ((match = variableRegex.exec(input)) !== null) {
			const variableName = match[1].trim();
			const fullMatch = match[0];

			// Try to resolve the variable
			const resolvedValue = this.resolveVariable(variableName, contextScope, collectionId, requestId);

			if (resolvedValue !== null) {
				resolution.resolved = resolution.resolved.replace(fullMatch, resolvedValue.value);
				resolution.variables.push({
					key: variableName,
					value: resolvedValue.value,
					scope: resolvedValue.scope,
				});
			} else {
				resolution.unresolved.push(variableName);
			}
		}

		// Cache the result
		if (this.config.cacheResolution && this.resolutionCache.size < this.config.maxCacheSize) {
			this.resolutionCache.set(cacheKey, resolution);
		}

		return resolution;
	}

	private resolveVariable(
		key: string,
		contextScope?: VariableScope,
		collectionId?: string,
		requestId?: string
	): { value: string; scope: VariableScope } | null {
		// Check system variables first
		if (this.config.enableSystemVariables && this.systemVariables.has(key)) {
			const systemVar = this.systemVariables.get(key)!;
			const value = typeof systemVar.generator === 'function' ? systemVar.generator() : systemVar.generator;
			return { value: String(value), scope: 'global' };
		}

		// Resolution order: request -> collection -> global
		const scopesToCheck: { scope: VariableScope; scopeId?: string }[] = [];

		if (requestId && contextScope === 'request') {
			const requestScope = Array.from(this.scopes.values()).find(s => s.requestId === requestId);
			if (requestScope) scopesToCheck.push({ scope: 'request', scopeId: requestScope.id });
		}

		if (collectionId) {
			const collectionScope = Array.from(this.scopes.values()).find(s => s.collectionId === collectionId);
			if (collectionScope) scopesToCheck.push({ scope: 'collection', scopeId: collectionScope.id });
		}

		// Add global scopes
		const globalScopes = Array.from(this.scopes.values()).filter(s => s.type === 'global');
		globalScopes.forEach(scope => scopesToCheck.push({ scope: 'global', scopeId: scope.id }));

		// Search in order of precedence
		for (const { scope, scopeId } of scopesToCheck) {
			if (scopeId) {
				const scopeObj = this.scopes.get(scopeId);
				if (scopeObj) {
					const variable = scopeObj.variables.find(v => v.key === key && v.enabled);
					if (variable) {
						return { value: variable.value, scope };
					}
				}
			}
		}

		return null;
	}

	// Variable Usage Tracking
	getVariableUsage(variableId: string): VariableUsage | null {
		// This would be implemented to track where variables are used
		// For now, return a basic structure
		const variable = this.findVariable(variableId);
		if (!variable) return null;

		return {
			variableId,
			key: variable.key,
			usedIn: [],
			usageCount: 0,
		};
	}

	// Validation
	validateVariable(variable: Partial<EnvironmentVariable>): VariableValidation {
		const validation: VariableValidation = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		// Validate key
		if (!variable.key || variable.key.trim() === '') {
			validation.errors.push({
				field: 'key',
				message: 'Variable key is required',
			});
			validation.isValid = false;
		} else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.key)) {
			validation.errors.push({
				field: 'key',
				message: 'Variable key must start with a letter or underscore and contain only letters, numbers, and underscores',
			});
			validation.isValid = false;
		}

		// Validate value
		if (variable.value === undefined || variable.value === null) {
			validation.warnings.push({
				field: 'value',
				message: 'Variable value is empty',
			});
		}

		return validation;
	}

	// Import/Export
	exportVariables(export_config: VariableExport): string {
		const variables = this.getVariables(export_config.scope ? { scope: export_config.scope } : undefined);

		const exportData = variables.filter(v => export_config.includeSecrets || v.type !== 'secret');

		switch (export_config.format) {
			case 'json':
				return JSON.stringify(
					{
						variables: exportData,
						exportedAt: export_config.timestamp,
						version: '1.0',
					},
					null,
					2
				);

			case 'env':
				return exportData.map(v => `${v.key}=${v.value}`).join('\n');

			case 'csv': {
				const headers = 'Key,Value,Type,Scope,Description,Enabled';
				const rows = exportData.map(v => `"${v.key}","${v.value}","${v.type}","${v.scope}","${v.description || ''}","${v.enabled}"`);
				return [headers, ...rows].join('\n');
			}

			default:
				throw new Error(`Unsupported export format: ${export_config.format}`);
		}
	}

	importVariables(import_config: VariableImport): number {
		// Implementation would parse the import data and create variables
		// For now, return 0 as placeholder
		return 0;
	}

	// System Variables
	private initializeSystemVariables(): void {
		const systemVars: SystemVariable[] = [
			// Date/Time Variables
			{
				key: '$timestamp',
				generator: () => Date.now().toString(),
				description: 'Current timestamp in milliseconds',
				category: 'date',
				readonly: true,
			},
			{
				key: '$isoTimestamp',
				generator: () => new Date().toISOString(),
				description: 'Current timestamp in ISO format',
				category: 'date',
				readonly: true,
			},
			{
				key: '$dateToday',
				generator: () => new Date().toISOString().split('T')[0],
				description: 'Current date in YYYY-MM-DD format',
				category: 'date',
				readonly: true,
			},
			{
				key: '$timeNow',
				generator: () => new Date().toTimeString().split(' ')[0],
				description: 'Current time in HH:MM:SS format',
				category: 'date',
				readonly: true,
			},
			{
				key: '$dateTime',
				generator: () => new Date().toLocaleString(),
				description: 'Current date and time in locale format',
				category: 'date',
				readonly: true,
			},

			// Random Number Variables
			{
				key: '$randomInt',
				generator: () => Math.floor(Math.random() * 1000000).toString(),
				description: 'Random integer between 0 and 999999',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomInt1',
				generator: () => Math.floor(Math.random() * 10).toString(),
				description: 'Random single digit (0-9)',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomInt2',
				generator: () => Math.floor(Math.random() * 100).toString(),
				description: 'Random two digit number (0-99)',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomInt3',
				generator: () => Math.floor(Math.random() * 1000).toString(),
				description: 'Random three digit number (0-999)',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomFloat',
				generator: () => (Math.random() * 100).toFixed(2),
				description: 'Random float number with 2 decimal places',
				category: 'random',
				readonly: true,
			},

			// Random String Variables
			{
				key: '$randomString',
				generator: () => {
					const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
					return Array.from({ length: 13 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
				},
				description: 'Random alphanumeric string (13 characters)',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomString5',
				generator: () => {
					const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
					return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
				},
				description: 'Random alphanumeric string (5 characters)',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomString10',
				generator: () => {
					const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
					return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
				},
				description: 'Random alphanumeric string (10 characters)',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomString20',
				generator: () => {
					const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
					return Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
				},
				description: 'Random alphanumeric string (20 characters)',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomAlpha',
				generator: () => {
					const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
					return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
				},
				description: 'Random alphabetic string (10 characters)',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomHex',
				generator: () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
				description: 'Random hexadecimal string (16 characters)',
				category: 'random',
				readonly: true,
			},

			// GUID/UUID Variables
			{
				key: '$randomUUID',
				generator: () => crypto.randomUUID(),
				description: 'Random UUID v4',
				category: 'uuid',
				readonly: true,
			},
			{
				key: '$guid',
				generator: () => crypto.randomUUID(),
				description: 'Random GUID (alias for randomUUID)',
				category: 'uuid',
				readonly: true,
			},

			// Email Generation Variables
			{
				key: '$randomEmail',
				generator: () => {
					const names = ['john', 'jane', 'alex', 'sarah', 'mike', 'emma', 'david', 'lisa', 'chris', 'anna'];
					const domains = ['example.com', 'test.com', 'demo.org', 'sample.net', 'mock.io'];
					const name = names[Math.floor(Math.random() * names.length)];
					const domain = domains[Math.floor(Math.random() * domains.length)];
					const number = Math.floor(Math.random() * 1000);
					return `${name}${number}@${domain}`;
				},
				description: 'Random email address',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomFirstName',
				generator: () => {
					const names = ['John', 'Jane', 'Alex', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'Chris', 'Anna', 'Tom', 'Lucy', 'James', 'Maria', 'Robert'];
					return names[Math.floor(Math.random() * names.length)];
				},
				description: 'Random first name',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomLastName',
				generator: () => {
					const names = [
						'Smith',
						'Johnson',
						'Williams',
						'Brown',
						'Jones',
						'Garcia',
						'Miller',
						'Davis',
						'Rodriguez',
						'Martinez',
						'Wilson',
						'Anderson',
						'Taylor',
						'Thomas',
						'Jackson',
					];
					return names[Math.floor(Math.random() * names.length)];
				},
				description: 'Random last name',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomFullName',
				generator: () => {
					const firstNames = ['John', 'Jane', 'Alex', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'Chris', 'Anna'];
					const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
					const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
					const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
					return `${firstName} ${lastName}`;
				},
				description: 'Random full name',
				category: 'random',
				readonly: true,
			},

			// System Variables
			{
				key: '$userAgent',
				generator: () => 'VS-Code-API-Client/1.0.0',
				description: 'Default user agent string',
				category: 'system',
				readonly: true,
			},
			{
				key: '$randomBoolean',
				generator: () => (Math.random() < 0.5 ? 'true' : 'false'),
				description: 'Random boolean value',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomIP',
				generator: () => {
					return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
				},
				description: 'Random IPv4 address',
				category: 'random',
				readonly: true,
			},
			{
				key: '$randomPort',
				generator: () => (Math.floor(Math.random() * 65535) + 1).toString(),
				description: 'Random port number (1-65535)',
				category: 'random',
				readonly: true,
			},
		];

		systemVars.forEach(sysVar => {
			this.systemVariables.set(sysVar.key, sysVar);
		});
	}

	getSystemVariables(): SystemVariable[] {
		return Array.from(this.systemVariables.values());
	}

	// Configuration
	getConfiguration(): VariableConfiguration {
		return { ...this.config };
	}

	updateConfiguration(updates: Partial<VariableConfiguration>): void {
		Object.assign(this.config, updates);
		this.saveToStorage();
	}

	// Utility Methods
	private generateId(): string {
		return `env_${Date.now()}_${Math.random().toString(36).substring(2)}`;
	}

	private findVariable(variableId: string): EnvironmentVariable | null {
		for (const scope of this.scopes.values()) {
			const variable = scope.variables.find(v => v.id === variableId);
			if (variable) return variable;
		}
		return null;
	}

	private findVariableScope(variableId: string): string | null {
		for (const [scopeId, scope] of this.scopes.entries()) {
			if (scope.variables.some(v => v.id === variableId)) {
				return scopeId;
			}
		}
		return null;
	}

	private clearResolutionCache(): void {
		this.resolutionCache.clear();
	}

	private saveToStorage(): void {
		try {
			const data = {
				scopes: Array.from(this.scopes.entries()),
				activeScope: this.activeScope,
				config: this.config,
			};
			localStorage.setItem('vscode-api-client-environment', JSON.stringify(data));
		} catch (error) {
			console.error('Failed to save environment data:', error);
		}
	}

	private loadFromStorage(): void {
		try {
			const data = localStorage.getItem('vscode-api-client-environment');
			if (data) {
				const parsed = JSON.parse(data);
				this.scopes = new Map(parsed.scopes || []);
				this.activeScope = parsed.activeScope || null;
				this.config = { ...this.config, ...parsed.config };
			}
		} catch (error) {
			console.error('Failed to load environment data:', error);
		}
	}

	// Clear all data
	clearAll(): void {
		this.scopes.clear();
		this.activeScope = null;
		this.clearResolutionCache();
		this.saveToStorage();
	}
}

export const environmentService = new EnvironmentService();
