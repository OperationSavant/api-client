// Test execution engine for VS Code API Client
import type { TestSuite, TestAssertion, TestResult, TestExecution, ResponseTestData} from '@/shared/types/testing';
import { TestAssertionType, TestOperator } from '@/shared/types/testing';

// Simple UUID generator for environments where crypto.randomUUID is not available
const generateUUID = (): string => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

export class TestExecutor {
	/**
	 * Execute a test suite against response data
	 */
	async executeTestSuite(suite: TestSuite, responseData: ResponseTestData): Promise<TestExecution> {
		const startTime = Date.now();
		const results: TestResult[] = [];

		if (!suite.enabled) {
			return {
				id: generateUUID(),
				suiteId: suite.id,
				timestamp: new Date(),
				duration: 0,
				results: [],
				status: 'passed',
				totalTests: 0,
				passedTests: 0,
				failedTests: 0,
			};
		}

		// Execute each enabled assertion
		for (const assertion of suite.assertions) {
			if (assertion.enabled) {
				const result = await this.executeAssertion(assertion, responseData);
				results.push(result);
			}
		}

		const duration = Date.now() - startTime;
		const passedTests = results.filter(r => r.passed).length;
		const failedTests = results.filter(r => !r.passed).length;
		const status = failedTests === 0 ? 'passed' : 'failed';

		return {
			id: generateUUID(),
			suiteId: suite.id,
			timestamp: new Date(),
			duration,
			results,
			status,
			totalTests: results.length,
			passedTests,
			failedTests,
		};
	}

	/**
	 * Execute a single test assertion
	 */
	private async executeAssertion(assertion: TestAssertion, responseData: ResponseTestData): Promise<TestResult> {
		try {
			const actualValue = this.extractActualValue(assertion, responseData);
			const passed = this.evaluateAssertion(assertion, actualValue);

			return {
				id: generateUUID(),
				assertionId: assertion.id,
				passed,
				actualValue,
				expectedValue: assertion.expectedValue,
				message: this.generateResultMessage(assertion, actualValue, passed),
			};
		} catch (error) {
			return {
				id: generateUUID(),
				assertionId: assertion.id,
				passed: false,
				actualValue: null,
				expectedValue: assertion.expectedValue,
				error: error instanceof Error ? error.message : 'Unknown error',
				message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Extract the actual value from response data based on assertion type
	 */
	private extractActualValue(assertion: TestAssertion, responseData: ResponseTestData): any {
		switch (assertion.type) {
			case 'status-code':
				return responseData.status;

			case 'response-time':
				return responseData.responseTime;

			case 'content-type':
				return responseData.contentType;

			case 'content-length':
				return responseData.size;

			case 'header-exists':
				return assertion.field ? assertion.field.toLowerCase() in responseData.headers : false;

			case 'header-value':
				return assertion.field ? responseData.headers[assertion.field.toLowerCase()] : undefined;

			case 'header-pattern':
				return assertion.field ? responseData.headers[assertion.field.toLowerCase()] : undefined;

			case 'json-path':
				return this.extractJsonPath(responseData.data, assertion.field || '');

			case 'json-property-exists':
				return this.hasJsonProperty(responseData.data, assertion.field || '');

			case 'json-value-equals':
			case 'json-value-contains':
			case 'json-value-type':
				return this.extractJsonPath(responseData.data, assertion.field || '');

			case 'json-array-length': {
				const arrayValue = this.extractJsonPath(responseData.data, assertion.field || '');
				return Array.isArray(arrayValue) ? arrayValue.length : 0;
			}

			case 'response-body-contains':
			case 'response-body-matches':
				return responseData.body;

			case 'response-size':
				return responseData.size;

			default:
				throw new Error(`Unsupported assertion type: ${assertion.type}`);
		}
	}

	/**
	 * Evaluate assertion based on operator and values
	 */
	private evaluateAssertion(assertion: TestAssertion, actualValue: any): boolean {
		const { operator, expectedValue, type } = assertion;

		// For boolean assertion types, directly compare boolean results
		if (type === 'header-exists' || type === 'json-property-exists') {
			if (operator === 'exists') {
				return Boolean(actualValue) === Boolean(expectedValue);
			} else if (operator === 'not-exists') {
				return Boolean(actualValue) !== Boolean(expectedValue);
			}
		}

		switch (operator) {
			case 'equals':
				return actualValue === expectedValue;

			case 'not-equals':
				return actualValue !== expectedValue;

			case 'greater-than':
				return Number(actualValue) > Number(expectedValue);

			case 'less-than':
				return Number(actualValue) < Number(expectedValue);

			case 'greater-than-or-equals':
				return Number(actualValue) >= Number(expectedValue);

			case 'less-than-or-equals':
				return Number(actualValue) <= Number(expectedValue);

			case 'contains':
				return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());

			case 'not-contains':
				return !String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());

			case 'matches':
				try {
					const regex = new RegExp(String(expectedValue), 'i');
					return regex.test(String(actualValue));
				} catch {
					return false;
				}

			case 'not-matches':
				try {
					const regex = new RegExp(String(expectedValue), 'i');
					return !regex.test(String(actualValue));
				} catch {
					return true;
				}

			case 'starts-with':
				return String(actualValue).toLowerCase().startsWith(String(expectedValue).toLowerCase());

			case 'ends-with':
				return String(actualValue).toLowerCase().endsWith(String(expectedValue).toLowerCase());

			case 'exists': {
				const exists = actualValue !== undefined && actualValue !== null;
				return expectedValue ? exists : !exists;
			}

			case 'not-exists': {
				const notExists = actualValue === undefined || actualValue === null;
				return expectedValue ? notExists : !notExists;
			}

			case 'is-type':
				return typeof actualValue === expectedValue;

			case 'in-range':
				// Expected value should be "min,max"
				try {
					const [min, max] = String(expectedValue)
						.split(',')
						.map(v => Number(v.trim()));
					const num = Number(actualValue);
					return num >= min && num <= max;
				} catch {
					return false;
				}

			default:
				throw new Error(`Unsupported operator: ${operator}`);
		}
	}

	/**
	 * Extract value from JSON object using dot notation path
	 */
	private extractJsonPath(data: any, path: string): any {
		if (!path || !data) return undefined;

		const parts = path.split('.');
		let current = data;

		for (const part of parts) {
			if (current === null || current === undefined) {
				return undefined;
			}

			// Handle array indices
			if (part.includes('[') && part.includes(']')) {
				const arrayName = part.substring(0, part.indexOf('['));
				const indexStr = part.substring(part.indexOf('[') + 1, part.indexOf(']'));

				if (arrayName) {
					current = current[arrayName];
				}

				if (Array.isArray(current)) {
					const index = parseInt(indexStr);
					current = current[index];
				}
			} else {
				current = current[part];
			}
		}

		return current;
	}

	/**
	 * Check if JSON object has a specific property
	 */
	private hasJsonProperty(data: any, path: string): boolean {
		if (!path || !data) return false;

		const parts = path.split('.');
		let current = data;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];

			if (current === null || current === undefined) {
				return false;
			}

			// Handle array indices
			if (part.includes('[') && part.includes(']')) {
				const arrayName = part.substring(0, part.indexOf('['));
				const indexStr = part.substring(part.indexOf('[') + 1, part.indexOf(']'));

				if (arrayName) {
					if (!(arrayName in current)) {
						return false;
					}
					current = current[arrayName];
				}

				if (Array.isArray(current)) {
					const index = parseInt(indexStr);
					if (index >= current.length) {
						return false;
					}
					current = current[index];
				}
			} else {
				if (!(part in current)) {
					return false;
				}
				current = current[part];
			}
		}

		return true;
	}

	/**
	 * Generate human-readable result message
	 */
	private generateResultMessage(assertion: TestAssertion, actualValue: any, passed: boolean): string {
		const description = assertion.description || this.getDefaultDescription(assertion);

		if (passed) {
			return `✓ ${description}`;
		} else {
			return `✗ ${description} (Expected: ${assertion.expectedValue}, Actual: ${actualValue})`;
		}
	}

	/**
	 * Generate default description for assertion
	 */
	private getDefaultDescription(assertion: TestAssertion): string {
		const { type, operator, field, expectedValue } = assertion;

		switch (type) {
			case 'status-code':
				return `Status code ${operator.replace('-', ' ')} ${expectedValue}`;

			case 'response-time':
				return `Response time ${operator.replace('-', ' ')} ${expectedValue}ms`;

			case 'content-type':
				return `Content-Type ${operator.replace('-', ' ')} ${expectedValue}`;

			case 'header-exists':
				return `Header '${field}' ${operator === 'exists' ? 'exists' : 'does not exist'}`;

			case 'header-value':
				return `Header '${field}' ${operator.replace('-', ' ')} '${expectedValue}'`;

			case 'json-path':
				return `JSON path '${field}' ${operator.replace('-', ' ')} ${expectedValue}`;

			case 'json-property-exists':
				return `JSON property '${field}' ${operator === 'exists' ? 'exists' : 'does not exist'}`;

			case 'response-body-contains':
				return `Response body ${operator.replace('-', ' ')} '${expectedValue}'`;

			case 'response-size':
				return `Response size ${operator.replace('-', ' ')} ${expectedValue} bytes`;

			default:
				return `${type} ${operator.replace('-', ' ')} ${expectedValue}`;
		}
	}
}

/**
 * Create ResponseTestData from a fetch Response
 */
export const createResponseTestData = async (response: Response, responseTime: number): Promise<ResponseTestData> => {
	const body = await response.text();
	const headers: Record<string, string> = {};

	// Convert Headers to plain object - handle both Map and Headers objects
	if (response.headers && typeof response.headers.forEach === 'function') {
		response.headers.forEach((value: string, key: string) => {
			headers[key.toLowerCase()] = value;
		});
	}

	let data: any = undefined;
	const contentType = headers['content-type'] || '';

	// Try to parse JSON data
	if (contentType.includes('application/json')) {
		try {
			data = JSON.parse(body);
		} catch {
			// Keep data as undefined if JSON parsing fails
		}
	}

	return {
		status: response.status,
		statusText: response.statusText,
		headers,
		body,
		contentType,
		responseTime,
		size: body.length,
		data,
	};
};

// Singleton instance
export const testExecutor = new TestExecutor();
