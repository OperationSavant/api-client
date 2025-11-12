import { environmentService } from '@/services/environment-service';
import { EnvironmentVariable, VariableScope } from '@/shared/types/environment';

// Mock localStorage
const localStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: jest.fn(() => 'mock-uuid-1234-5678-9012'),
	},
});

describe('EnvironmentService', () => {
	beforeEach(() => {
		// Clear localStorage mock
		localStorageMock.getItem.mockClear();
		localStorageMock.setItem.mockClear();
		localStorageMock.removeItem.mockClear();
		localStorageMock.clear.mockClear();

		// Reset the service state
		environmentService.clearAll();
	});

	describe('Scope Management', () => {
		test('should create a new scope', () => {
			const scope = environmentService.createScope('Test Global', 'global');

			expect(scope.name).toBe('Test Global');
			expect(scope.type).toBe('global');
			expect(scope.variables).toHaveLength(0);
			expect(scope.isActive).toBe(false);
			expect(scope.id).toBeTruthy();
		});

		test('should create collection scope with collection ID', () => {
			const scope = environmentService.createScope('Test Collection', 'collection', 'col-123');

			expect(scope.type).toBe('collection');
			expect(scope.collectionId).toBe('col-123');
		});

		test('should create request scope with request ID', () => {
			const scope = environmentService.createScope('Test Request', 'request', undefined, 'req-456');

			expect(scope.type).toBe('request');
			expect(scope.requestId).toBe('req-456');
		});

		test('should retrieve scope by ID', () => {
			const scope = environmentService.createScope('Test Scope', 'global');
			const retrieved = environmentService.getScope(scope.id);

			expect(retrieved).toEqual(scope);
		});

		test('should return undefined for non-existent scope', () => {
			const retrieved = environmentService.getScope('non-existent');
			expect(retrieved).toBeUndefined();
		});

		test('should get scopes by type', () => {
			environmentService.createScope('Global 1', 'global');
			environmentService.createScope('Global 2', 'global');
			environmentService.createScope('Collection 1', 'collection', 'col-1');

			const globalScopes = environmentService.getScopes('global');
			expect(globalScopes).toHaveLength(2);
			expect(globalScopes.every(s => s.type === 'global')).toBe(true);
		});

		test('should get scopes by collection ID', () => {
			environmentService.createScope('Collection 1', 'collection', 'col-1');
			environmentService.createScope('Collection 2', 'collection', 'col-2');
			environmentService.createScope('Collection 1 Again', 'collection', 'col-1');

			const col1Scopes = environmentService.getScopes('collection', 'col-1');
			expect(col1Scopes).toHaveLength(2);
			expect(col1Scopes.every(s => s.collectionId === 'col-1')).toBe(true);
		});

		test('should update scope', () => {
			const scope = environmentService.createScope('Original Name', 'global');
			const success = environmentService.updateScope(scope.id, { name: 'Updated Name' });

			expect(success).toBe(true);
			const updated = environmentService.getScope(scope.id);
			expect(updated?.name).toBe('Updated Name');
		});

		test('should fail to update non-existent scope', () => {
			const success = environmentService.updateScope('non-existent', { name: 'New Name' });
			expect(success).toBe(false);
		});

		test('should delete scope', () => {
			const scope = environmentService.createScope('To Delete', 'global');
			const success = environmentService.deleteScope(scope.id);

			expect(success).toBe(true);
			expect(environmentService.getScope(scope.id)).toBeUndefined();
		});

		test('should set active scope', () => {
			const scope = environmentService.createScope('Active Scope', 'global');
			const success = environmentService.setActiveScope(scope.id);

			expect(success).toBe(true);
			expect(environmentService.getActiveScope()?.id).toBe(scope.id);
		});

		test('should deactivate previous active scope when setting new one', () => {
			const scope1 = environmentService.createScope('Scope 1', 'global');
			const scope2 = environmentService.createScope('Scope 2', 'global');

			environmentService.setActiveScope(scope1.id);
			environmentService.setActiveScope(scope2.id);

			expect(environmentService.getScope(scope1.id)?.isActive).toBe(false);
			expect(environmentService.getScope(scope2.id)?.isActive).toBe(true);
		});
	});

	describe('Variable Management', () => {
		let globalScope: any;

		beforeEach(() => {
			globalScope = environmentService.createScope('Global', 'global');
		});

		test('should add variable to scope', () => {
			const variable = environmentService.addVariable(globalScope.id, {
				key: 'API_URL',
				value: 'https://api.example.com',
				description: 'Main API URL',
				type: 'text',
				scope: 'global',
				enabled: true,
			});

			expect(variable).toBeTruthy();
			expect(variable?.key).toBe('API_URL');
			expect(variable?.value).toBe('https://api.example.com');
			expect(variable?.id).toBeTruthy();
		});

		test('should fail to add variable to non-existent scope', () => {
			const variable = environmentService.addVariable('non-existent', {
				key: 'TEST_VAR',
				value: 'test',
				type: 'text',
				scope: 'global',
				enabled: true,
			});

			expect(variable).toBeNull();
		});

		test('should prevent duplicate variable keys in same scope', () => {
			environmentService.addVariable(globalScope.id, {
				key: 'DUPLICATE_KEY',
				value: 'value1',
				type: 'text',
				scope: 'global',
				enabled: true,
			});

			expect(() => {
				environmentService.addVariable(globalScope.id, {
					key: 'DUPLICATE_KEY',
					value: 'value2',
					type: 'text',
					scope: 'global',
					enabled: true,
				});
			}).toThrow();
		});

		test('should validate variable key format', () => {
			expect(() => {
				environmentService.addVariable(globalScope.id, {
					key: '123invalid',
					value: 'test',
					type: 'text',
					scope: 'global',
					enabled: true,
				});
			}).toThrow();

			expect(() => {
				environmentService.addVariable(globalScope.id, {
					key: 'invalid-key',
					value: 'test',
					type: 'text',
					scope: 'global',
					enabled: true,
				});
			}).toThrow();
		});

		test('should get variable by scope and ID', () => {
			const added = environmentService.addVariable(globalScope.id, {
				key: 'TEST_VAR',
				value: 'test',
				type: 'text',
				scope: 'global',
				enabled: true,
			});

			const retrieved = environmentService.getVariable(globalScope.id, added!.id);
			expect(retrieved).toEqual(added);
		});

		test('should update variable', () => {
			const variable = environmentService.addVariable(globalScope.id, {
				key: 'UPDATE_ME',
				value: 'original',
				type: 'text',
				scope: 'global',
				enabled: true,
			});

			const success = environmentService.updateVariable(globalScope.id, variable!.id, {
				value: 'updated',
				description: 'Updated description',
			});

			expect(success).toBe(true);
			const updated = environmentService.getVariable(globalScope.id, variable!.id);
			expect(updated?.value).toBe('updated');
			expect(updated?.description).toBe('Updated description');
		});

		test('should delete variable', () => {
			const variable = environmentService.addVariable(globalScope.id, {
				key: 'DELETE_ME',
				value: 'temp',
				type: 'text',
				scope: 'global',
				enabled: true,
			});

			const success = environmentService.deleteVariable(globalScope.id, variable!.id);
			expect(success).toBe(true);
			expect(environmentService.getVariable(globalScope.id, variable!.id)).toBeUndefined();
		});
	});

	describe('Variable Resolution', () => {
		let globalScope: any;
		let collectionScope: any;

		beforeEach(() => {
			globalScope = environmentService.createScope('Global', 'global');
			collectionScope = environmentService.createScope('Collection', 'collection', 'col-123');

			// Add test variables
			environmentService.addVariable(globalScope.id, {
				key: 'GLOBAL_VAR',
				value: 'global_value',
				type: 'text',
				scope: 'global',
				enabled: true,
			});

			environmentService.addVariable(collectionScope.id, {
				key: 'COLLECTION_VAR',
				value: 'collection_value',
				type: 'text',
				scope: 'collection',
				enabled: true,
			});

			environmentService.addVariable(collectionScope.id, {
				key: 'OVERRIDE_VAR',
				value: 'collection_override',
				type: 'text',
				scope: 'collection',
				enabled: true,
			});

			environmentService.addVariable(globalScope.id, {
				key: 'OVERRIDE_VAR',
				value: 'global_original',
				type: 'text',
				scope: 'global',
				enabled: true,
			});
		});

		test('should resolve simple variable reference', () => {
			const result = environmentService.resolveString('{{GLOBAL_VAR}}');

			expect(result.resolved).toBe('global_value');
			expect(result.variables).toHaveLength(1);
			expect(result.variables[0].key).toBe('GLOBAL_VAR');
			expect(result.unresolved).toHaveLength(0);
		});

		test('should resolve multiple variables in string', () => {
			const result = environmentService.resolveString('{{GLOBAL_VAR}}/{{COLLECTION_VAR}}', 'collection', 'col-123');

			expect(result.resolved).toBe('global_value/collection_value');
			expect(result.variables).toHaveLength(2);
		});

		test('should resolve variables with text around them', () => {
			const result = environmentService.resolveString('https://{{GLOBAL_VAR}}/api/v1');

			expect(result.resolved).toBe('https://global_value/api/v1');
		});

		test('should handle unresolved variables', () => {
			const result = environmentService.resolveString('{{GLOBAL_VAR}}/{{NON_EXISTENT}}');

			expect(result.resolved).toBe('global_value/{{NON_EXISTENT}}');
			expect(result.variables).toHaveLength(1);
			expect(result.unresolved).toHaveLength(1);
			expect(result.unresolved[0]).toBe('NON_EXISTENT');
		});

		test('should respect scope precedence (collection over global)', () => {
			const result = environmentService.resolveString('{{OVERRIDE_VAR}}', 'collection', 'col-123');

			expect(result.resolved).toBe('collection_override');
			expect(result.variables[0].scope).toBe('collection');
		});

		test('should handle disabled variables', () => {
			// Disable the collection variable
			const collectionVar = collectionScope.variables.find((v: any) => v.key === 'OVERRIDE_VAR');
			environmentService.updateVariable(collectionScope.id, collectionVar.id, { enabled: false });

			const result = environmentService.resolveString('{{OVERRIDE_VAR}}', 'collection', 'col-123');

			// Should fall back to global variable
			expect(result.resolved).toBe('global_original');
			expect(result.variables[0].scope).toBe('global');
		});
	});

	describe('System Variables', () => {
		test('should resolve system timestamp variable', () => {
			const result = environmentService.resolveString('{{$timestamp}}');

			expect(result.resolved).toMatch(/^\d+$/);
			expect(result.variables).toHaveLength(1);
			expect(result.variables[0].key).toBe('$timestamp');
		});

		test('should resolve system UUID variable', () => {
			const result = environmentService.resolveString('{{$randomUUID}}');

			expect(result.resolved).toBe('mock-uuid-1234-5678-9012');
			expect(result.variables).toHaveLength(1);
		});

		test('should resolve date/time system variables', () => {
			const isoResult = environmentService.resolveString('{{$isoTimestamp}}');
			expect(isoResult.resolved).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

			const dateResult = environmentService.resolveString('{{$dateToday}}');
			expect(dateResult.resolved).toMatch(/^\d{4}-\d{2}-\d{2}$/);

			const timeResult = environmentService.resolveString('{{$timeNow}}');
			expect(timeResult.resolved).toMatch(/^\d{2}:\d{2}:\d{2}$/);
		});

		test('should resolve random number system variables', () => {
			const randomIntResult = environmentService.resolveString('{{$randomInt}}');
			expect(randomIntResult.resolved).toMatch(/^\d+$/);
			expect(parseInt(randomIntResult.resolved)).toBeLessThan(1000000);

			const randomInt1Result = environmentService.resolveString('{{$randomInt1}}');
			expect(randomInt1Result.resolved).toMatch(/^\d$/);
			expect(parseInt(randomInt1Result.resolved)).toBeLessThan(10);

			const randomFloatResult = environmentService.resolveString('{{$randomFloat}}');
			expect(randomFloatResult.resolved).toMatch(/^\d+\.\d{2}$/);
		});

		test('should resolve random string system variables', () => {
			const randomStringResult = environmentService.resolveString('{{$randomString}}');
			expect(randomStringResult.resolved).toMatch(/^[a-z0-9]{13}$/);

			const randomString5Result = environmentService.resolveString('{{$randomString5}}');
			expect(randomString5Result.resolved).toMatch(/^[a-z0-9]{5}$/);

			const randomString10Result = environmentService.resolveString('{{$randomString10}}');
			expect(randomString10Result.resolved).toMatch(/^[a-z0-9]{10}$/);

			const randomAlphaResult = environmentService.resolveString('{{$randomAlpha}}');
			expect(randomAlphaResult.resolved).toMatch(/^[a-zA-Z]{10}$/);

			const randomHexResult = environmentService.resolveString('{{$randomHex}}');
			expect(randomHexResult.resolved).toMatch(/^[0-9a-f]{16}$/);
		});

		test('should resolve email generation system variables', () => {
			const randomEmailResult = environmentService.resolveString('{{$randomEmail}}');
			expect(randomEmailResult.resolved).toMatch(/^[a-z]+\d+@[a-z]+\.[a-z]+$/);

			const firstNameResult = environmentService.resolveString('{{$randomFirstName}}');
			expect(firstNameResult.resolved).toMatch(/^[A-Z][a-z]+$/);

			const lastNameResult = environmentService.resolveString('{{$randomLastName}}');
			expect(lastNameResult.resolved).toMatch(/^[A-Z][a-z]+$/);

			const fullNameResult = environmentService.resolveString('{{$randomFullName}}');
			expect(fullNameResult.resolved).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
		});

		test('should resolve GUID system variables', () => {
			const guidResult = environmentService.resolveString('{{$guid}}');
			expect(guidResult.resolved).toBe('mock-uuid-1234-5678-9012');

			const uuidResult = environmentService.resolveString('{{$randomUUID}}');
			expect(uuidResult.resolved).toBe('mock-uuid-1234-5678-9012');
		});

		test('should resolve system utility variables', () => {
			const userAgentResult = environmentService.resolveString('{{$userAgent}}');
			expect(userAgentResult.resolved).toBe('VS-Code-API-Client/1.0.0');

			const booleanResult = environmentService.resolveString('{{$randomBoolean}}');
			expect(['true', 'false']).toContain(booleanResult.resolved);

			const ipResult = environmentService.resolveString('{{$randomIP}}');
			expect(ipResult.resolved).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

			const portResult = environmentService.resolveString('{{$randomPort}}');
			expect(parseInt(portResult.resolved)).toBeGreaterThan(0);
			expect(parseInt(portResult.resolved)).toBeLessThanOrEqual(65535);
		});

		test('should get all system variables with comprehensive count', () => {
			const systemVars = environmentService.getSystemVariables();

			expect(systemVars.length).toBeGreaterThanOrEqual(25); // We added many new variables
			expect(systemVars.every(v => v.readonly)).toBe(true);

			// Check key categories are present
			const categories = systemVars.map(v => v.category);
			expect(categories).toContain('date');
			expect(categories).toContain('random');
			expect(categories).toContain('uuid');
			expect(categories).toContain('system');

			// Check specific variables exist
			const keys = systemVars.map(v => v.key);
			expect(keys).toContain('$timestamp');
			expect(keys).toContain('$randomEmail');
			expect(keys).toContain('$randomInt');
			expect(keys).toContain('$randomString');
			expect(keys).toContain('$dateToday');
			expect(keys).toContain('$userAgent');
		});

		test('should categorize system variables correctly', () => {
			const systemVars = environmentService.getSystemVariables();

			const dateVars = systemVars.filter(v => v.category === 'date');
			expect(dateVars.length).toBeGreaterThan(0);
			expect(dateVars.some(v => v.key === '$timestamp')).toBe(true);
			expect(dateVars.some(v => v.key === '$dateToday')).toBe(true);

			const randomVars = systemVars.filter(v => v.category === 'random');
			expect(randomVars.length).toBeGreaterThan(10); // We have many random variables

			const uuidVars = systemVars.filter(v => v.category === 'uuid');
			expect(uuidVars.length).toBeGreaterThanOrEqual(2); // $randomUUID and $guid

			const systemCategoryVars = systemVars.filter(v => v.category === 'system');
			expect(systemCategoryVars.length).toBeGreaterThan(0);
		});
	});

	describe('Variable Filtering and Sorting', () => {
		beforeEach(() => {
			const globalScope = environmentService.createScope('Global', 'global');
			const collectionScope = environmentService.createScope('Collection', 'collection', 'col-1');

			// Add test variables
			environmentService.addVariable(globalScope.id, {
				key: 'GLOBAL_TEXT',
				value: 'text_value',
				type: 'text',
				scope: 'global',
				enabled: true,
			});

			environmentService.addVariable(globalScope.id, {
				key: 'GLOBAL_SECRET',
				value: 'secret_value',
				type: 'secret',
				scope: 'global',
				enabled: false,
			});

			environmentService.addVariable(collectionScope.id, {
				key: 'COLLECTION_VAR',
				value: 'collection_value',
				type: 'text',
				scope: 'collection',
				enabled: true,
			});
		});

		test('should filter variables by scope', () => {
			const globalVars = environmentService.getVariables({ scope: ['global'] });
			expect(globalVars).toHaveLength(2);
			expect(globalVars.every(v => v.scope === 'global')).toBe(true);
		});

		test('should filter variables by type', () => {
			const secretVars = environmentService.getVariables({ type: ['secret'] });
			expect(secretVars).toHaveLength(1);
			expect(secretVars[0].type).toBe('secret');
		});

		test('should filter variables by enabled status', () => {
			const enabledVars = environmentService.getVariables({ enabled: true });
			expect(enabledVars).toHaveLength(2);
			expect(enabledVars.every(v => v.enabled)).toBe(true);
		});

		test('should filter variables by search term', () => {
			const searchResults = environmentService.getVariables({ searchTerm: 'GLOBAL' });
			expect(searchResults).toHaveLength(2);
			expect(searchResults.every(v => v.key.includes('GLOBAL'))).toBe(true);
		});

		test('should sort variables by key ascending', () => {
			const sorted = environmentService.getVariables(undefined, { field: 'key', direction: 'asc' });
			expect(sorted[0].key).toBe('COLLECTION_VAR');
			expect(sorted[1].key).toBe('GLOBAL_SECRET');
			expect(sorted[2].key).toBe('GLOBAL_TEXT');
		});

		test('should sort variables by key descending', () => {
			const sorted = environmentService.getVariables(undefined, { field: 'key', direction: 'desc' });
			expect(sorted[0].key).toBe('GLOBAL_TEXT');
			expect(sorted[1].key).toBe('GLOBAL_SECRET');
			expect(sorted[2].key).toBe('COLLECTION_VAR');
		});
	});

	describe('Export Functionality', () => {
		beforeEach(() => {
			const globalScope = environmentService.createScope('Global', 'global');
			environmentService.addVariable(globalScope.id, {
				key: 'EXPORT_TEST',
				value: 'export_value',
				description: 'Test variable for export',
				type: 'text',
				scope: 'global',
				enabled: true,
			});

			environmentService.addVariable(globalScope.id, {
				key: 'SECRET_VAR',
				value: 'secret_value',
				type: 'secret',
				scope: 'global',
				enabled: true,
			});
		});

		test('should export variables as JSON', () => {
			const exported = environmentService.exportVariables({
				format: 'json',
				includeSecrets: true,
				timestamp: new Date(),
			});

			const parsed = JSON.parse(exported);
			expect(parsed.variables).toHaveLength(2);
			expect(parsed.version).toBe('1.0');
			expect(parsed.exportedAt).toBeTruthy();
		});

		test('should export variables as ENV format', () => {
			const exported = environmentService.exportVariables({
				format: 'env',
				includeSecrets: true,
				timestamp: new Date(),
			});

			expect(exported).toContain('EXPORT_TEST=export_value');
			expect(exported).toContain('SECRET_VAR=secret_value');
		});

		test('should export variables as CSV format', () => {
			const exported = environmentService.exportVariables({
				format: 'csv',
				includeSecrets: true,
				timestamp: new Date(),
			});

			expect(exported).toContain('Key,Value,Type,Scope,Description,Enabled');
			expect(exported).toContain('"EXPORT_TEST","export_value","text","global","Test variable for export","true"');
		});

		test('should exclude secrets when includeSecrets is false', () => {
			const exported = environmentService.exportVariables({
				format: 'json',
				includeSecrets: false,
				timestamp: new Date(),
			});

			const parsed = JSON.parse(exported);
			expect(parsed.variables).toHaveLength(1);
			expect(parsed.variables[0].key).toBe('EXPORT_TEST');
		});
	});

	describe('Validation', () => {
		test('should validate valid variable', () => {
			const validation = environmentService['validateVariable']({
				key: 'VALID_KEY',
				value: 'valid_value',
				type: 'text',
				enabled: true,
			});

			expect(validation.isValid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		test('should reject empty key', () => {
			const validation = environmentService['validateVariable']({
				key: '',
				value: 'value',
				type: 'text',
				enabled: true,
			});

			expect(validation.isValid).toBe(false);
			expect(validation.errors.some(e => e.field === 'key')).toBe(true);
		});

		test('should reject invalid key format', () => {
			const validation = environmentService['validateVariable']({
				key: '123-invalid',
				value: 'value',
				type: 'text',
				enabled: true,
			});

			expect(validation.isValid).toBe(false);
			expect(validation.errors.some(e => e.field === 'key')).toBe(true);
		});

		test('should warn about empty value', () => {
			const validation = environmentService['validateVariable']({
				key: 'VALID_KEY',
				value: undefined,
				type: 'text',
				enabled: true,
			});

			expect(validation.isValid).toBe(true);
			expect(validation.warnings.some(w => w.field === 'value')).toBe(true);
		});
	});

	describe('Configuration', () => {
		test('should get default configuration', () => {
			const config = environmentService.getConfiguration();

			expect(config.maxVariables).toBe(500);
			expect(config.enableSystemVariables).toBe(true);
			expect(config.autoComplete).toBe(true);
		});

		test('should update configuration', () => {
			environmentService.updateConfiguration({
				maxVariables: 1000,
				enableSystemVariables: false,
			});

			const config = environmentService.getConfiguration();
			expect(config.maxVariables).toBe(1000);
			expect(config.enableSystemVariables).toBe(false);
			expect(config.autoComplete).toBe(true); // unchanged
		});
	});
});
