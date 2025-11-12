// Testing framework types for VS Code API Client

export type TestAssertionType =
	| 'status-code'
	| 'response-time'
	| 'content-type'
	| 'content-length'
	| 'header-exists'
	| 'header-value'
	| 'header-pattern'
	| 'json-path'
	| 'json-property-exists'
	| 'json-value-equals'
	| 'json-value-contains'
	| 'json-value-type'
	| 'json-array-length'
	| 'response-body-contains'
	| 'response-body-matches'
	| 'response-size';

export type TestOperator =
	| 'equals'
	| 'not-equals'
	| 'greater-than'
	| 'less-than'
	| 'greater-than-or-equals'
	| 'less-than-or-equals'
	| 'contains'
	| 'not-contains'
	| 'matches'
	| 'not-matches'
	| 'starts-with'
	| 'ends-with'
	| 'exists'
	| 'not-exists'
	| 'is-type'
	| 'in-range';

export interface TestAssertion {
	id: string;
	enabled: boolean;
	type: TestAssertionType;
	operator: TestOperator;
	field?: string; // For headers, JSON paths, etc.
	expectedValue: string | number | boolean;
	description?: string;
}

export interface TestResult {
	id: string;
	assertionId: string;
	passed: boolean;
	actualValue: any;
	expectedValue: any;
	error?: string;
	message: string;
}

export interface TestSuite {
	id: string;
	name: string;
	description?: string;
	assertions: TestAssertion[];
	enabled: boolean;
}

export interface TestExecution {
	id: string;
	suiteId: string;
	timestamp: Date;
	duration: number;
	results: TestResult[];
	status: 'passed' | 'failed' | 'error';
	totalTests: number;
	passedTests: number;
	failedTests: number;
}

export interface ResponseTestData {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
	contentType: string;
	responseTime: number;
	size: number;
	data?: any; // Parsed JSON/XML data
}

// Test assertion configuration for each type
export interface TestAssertionConfig {
	type: TestAssertionType;
	name: string;
	description: string;
	operators: TestOperator[];
	requiresField: boolean;
	fieldPlaceholder?: string;
	fieldDescription?: string;
	valueType: 'string' | 'number' | 'boolean' | 'array';
	examples: Array<{
		description: string;
		field?: string;
		operator: TestOperator;
		expectedValue: any;
	}>;
}

// Predefined test assertion configurations
export const TEST_ASSERTION_CONFIGS: TestAssertionConfig[] = [
	{
		type: 'status-code',
		name: 'Status Code',
		description: 'Validate HTTP response status code',
		operators: ['equals', 'not-equals', 'greater-than', 'less-than', 'in-range'],
		requiresField: false,
		valueType: 'number',
		examples: [
			{ description: 'Success response', operator: 'equals', expectedValue: 200 },
			{ description: 'Client error', operator: 'greater-than-or-equals', expectedValue: 400 },
			{ description: 'Not server error', operator: 'less-than', expectedValue: 500 },
		],
	},
	{
		type: 'response-time',
		name: 'Response Time',
		description: 'Validate API response time in milliseconds',
		operators: ['less-than', 'less-than-or-equals', 'greater-than', 'greater-than-or-equals'],
		requiresField: false,
		valueType: 'number',
		examples: [
			{ description: 'Fast response', operator: 'less-than', expectedValue: 1000 },
			{ description: 'Acceptable response', operator: 'less-than-or-equals', expectedValue: 3000 },
		],
	},
	{
		type: 'content-type',
		name: 'Content Type',
		description: 'Validate response Content-Type header',
		operators: ['equals', 'contains', 'starts-with', 'matches'],
		requiresField: false,
		valueType: 'string',
		examples: [
			{ description: 'JSON response', operator: 'equals', expectedValue: 'application/json' },
			{ description: 'JSON content', operator: 'contains', expectedValue: 'json' },
			{ description: 'HTML page', operator: 'starts-with', expectedValue: 'text/html' },
		],
	},
	{
		type: 'header-exists',
		name: 'Header Exists',
		description: 'Check if a specific header exists in the response',
		operators: ['exists', 'not-exists'],
		requiresField: true,
		fieldPlaceholder: 'Header name (e.g., X-API-Key)',
		fieldDescription: 'The name of the header to check',
		valueType: 'boolean',
		examples: [
			{ description: 'Has auth header', field: 'Authorization', operator: 'exists', expectedValue: true },
			{ description: 'No cache header', field: 'X-Cache', operator: 'not-exists', expectedValue: true },
		],
	},
	{
		type: 'header-value',
		name: 'Header Value',
		description: 'Validate the value of a specific header',
		operators: ['equals', 'not-equals', 'contains', 'matches', 'starts-with', 'ends-with'],
		requiresField: true,
		fieldPlaceholder: 'Header name (e.g., Server)',
		fieldDescription: 'The name of the header to validate',
		valueType: 'string',
		examples: [
			{ description: 'Server type', field: 'Server', operator: 'contains', expectedValue: 'nginx' },
			{ description: 'CORS header', field: 'Access-Control-Allow-Origin', operator: 'equals', expectedValue: '*' },
		],
	},
	{
		type: 'json-path',
		name: 'JSON Path Value',
		description: 'Validate value at a specific JSON path',
		operators: ['equals', 'not-equals', 'contains', 'greater-than', 'less-than', 'is-type'],
		requiresField: true,
		fieldPlaceholder: 'JSON path (e.g., data.user.id)',
		fieldDescription: 'The JSON path to the value you want to validate',
		valueType: 'string',
		examples: [
			{ description: 'User ID', field: 'data.user.id', operator: 'equals', expectedValue: '123' },
			{ description: 'Success status', field: 'status', operator: 'equals', expectedValue: 'success' },
			{ description: 'Array length', field: 'data.items.length', operator: 'greater-than', expectedValue: 0 },
		],
	},
	{
		type: 'json-property-exists',
		name: 'JSON Property Exists',
		description: 'Check if a JSON property exists',
		operators: ['exists', 'not-exists'],
		requiresField: true,
		fieldPlaceholder: 'Property path (e.g., data.user.email)',
		fieldDescription: 'The JSON path to the property you want to check',
		valueType: 'boolean',
		examples: [
			{ description: 'Has user email', field: 'data.user.email', operator: 'exists', expectedValue: true },
			{ description: 'No sensitive data', field: 'data.password', operator: 'not-exists', expectedValue: true },
		],
	},
	{
		type: 'response-body-contains',
		name: 'Response Body Contains',
		description: 'Check if response body contains specific text',
		operators: ['contains', 'not-contains', 'matches', 'not-matches'],
		requiresField: false,
		valueType: 'string',
		examples: [
			{ description: 'Success message', operator: 'contains', expectedValue: 'success' },
			{ description: 'No error text', operator: 'not-contains', expectedValue: 'error' },
		],
	},
	{
		type: 'response-size',
		name: 'Response Size',
		description: 'Validate response body size in bytes',
		operators: ['less-than', 'less-than-or-equals', 'greater-than', 'greater-than-or-equals'],
		requiresField: false,
		valueType: 'number',
		examples: [
			{ description: 'Small response', operator: 'less-than', expectedValue: 1024 },
			{ description: 'Has content', operator: 'greater-than', expectedValue: 0 },
		],
	},
];

// Utility functions for testing

// Simple UUID generator for environments where crypto.randomUUID is not available
const generateUUID = (): string => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

export const createDefaultTestAssertion = (type: TestAssertionType): TestAssertion => {
	const config = TEST_ASSERTION_CONFIGS.find(c => c.type === type);
	const example = config?.examples[0];

	return {
		id: generateUUID(),
		enabled: true,
		type,
		operator: example?.operator || 'equals',
		field: example?.field || '',
		expectedValue: example?.expectedValue || '',
		description: example?.description || '',
	};
};

export const createDefaultTestSuite = (): TestSuite => ({
	id: generateUUID(),
	name: 'New Test Suite',
	description: '',
	assertions: [],
	enabled: true,
});

export const getOperatorsForType = (type: TestAssertionType): TestOperator[] => {
	const config = TEST_ASSERTION_CONFIGS.find(c => c.type === type);
	return config?.operators || ['equals'];
};

export const requiresFieldForType = (type: TestAssertionType): boolean => {
	const config = TEST_ASSERTION_CONFIGS.find(c => c.type === type);
	return config?.requiresField || false;
};

export const getValueTypeForAssertion = (type: TestAssertionType): 'string' | 'number' | 'boolean' | 'array' => {
	const config = TEST_ASSERTION_CONFIGS.find(c => c.type === type);
	return config?.valueType || 'string';
};
