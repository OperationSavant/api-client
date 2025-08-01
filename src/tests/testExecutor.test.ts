import { TestExecutor, createResponseTestData } from '../utils/testExecutor';
import { TestSuite, TestAssertion, ResponseTestData, createDefaultTestSuite, createDefaultTestAssertion } from '../types/testing';

// Mock Response for testing environments
class MockResponse {
	public status: number;
	public statusText: string;
	public headers: Map<string, string>;
	private _body: string;

	constructor(body: string, options: { status: number; statusText: string; headers: Record<string, string> }) {
		this._body = body;
		this.status = options.status;
		this.statusText = options.statusText;
		this.headers = new Map();
		Object.entries(options.headers).forEach(([key, value]) => {
			this.headers.set(key.toLowerCase(), value);
		});
	}

	async text(): Promise<string> {
		return this._body;
	}
}

// Make MockResponse available globally for tests
(global as any).Response = MockResponse;

describe('TestExecutor', () => {
	let executor: TestExecutor;
	let mockResponseData: ResponseTestData;

	beforeEach(() => {
		executor = new TestExecutor();

		mockResponseData = {
			status: 200,
			statusText: 'OK',
			headers: {
				'content-type': 'application/json',
				'x-api-key': 'test-key',
				server: 'nginx/1.18.0',
				'cache-control': 'no-cache',
			},
			body: JSON.stringify({
				status: 'success',
				data: {
					user: {
						id: '123',
						name: 'John Doe',
						email: 'john@example.com',
					},
					items: ['item1', 'item2', 'item3'],
					count: 3,
				},
				message: 'Request processed successfully',
			}),
			contentType: 'application/json',
			responseTime: 145,
			size: 256,
			data: {
				status: 'success',
				data: {
					user: {
						id: '123',
						name: 'John Doe',
						email: 'john@example.com',
					},
					items: ['item1', 'item2', 'item3'],
					count: 3,
				},
				message: 'Request processed successfully',
			},
		};
	});

	describe('Status Code Tests', () => {
		it('should pass status code equals test', async () => {
			const assertion: TestAssertion = {
				id: 'test-1',
				enabled: true,
				type: 'status-code',
				operator: 'equals',
				expectedValue: 200,
				description: 'Status should be 200',
			};

			const suite: TestSuite = {
				id: 'suite-1',
				name: 'Status Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.totalTests).toBe(1);
			expect(result.passedTests).toBe(1);
			expect(result.failedTests).toBe(0);
			expect(result.results[0].passed).toBe(true);
			expect(result.results[0].actualValue).toBe(200);
		});

		it('should fail status code not equals test', async () => {
			const assertion: TestAssertion = {
				id: 'test-2',
				enabled: true,
				type: 'status-code',
				operator: 'equals',
				expectedValue: 404,
				description: 'Status should be 404',
			};

			const suite: TestSuite = {
				id: 'suite-2',
				name: 'Status Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('failed');
			expect(result.totalTests).toBe(1);
			expect(result.passedTests).toBe(0);
			expect(result.failedTests).toBe(1);
			expect(result.results[0].passed).toBe(false);
			expect(result.results[0].actualValue).toBe(200);
			expect(result.results[0].expectedValue).toBe(404);
		});

		it('should pass status code greater than test', async () => {
			const assertion: TestAssertion = {
				id: 'test-3',
				enabled: true,
				type: 'status-code',
				operator: 'greater-than-or-equals',
				expectedValue: 200,
				description: 'Status should be 2xx',
			};

			const suite: TestSuite = {
				id: 'suite-3',
				name: 'Status Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
		});
	});

	describe('Response Time Tests', () => {
		it('should pass response time less than test', async () => {
			const assertion: TestAssertion = {
				id: 'test-4',
				enabled: true,
				type: 'response-time',
				operator: 'less-than',
				expectedValue: 1000,
				description: 'Response time should be under 1 second',
			};

			const suite: TestSuite = {
				id: 'suite-4',
				name: 'Performance Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
			expect(result.results[0].actualValue).toBe(145);
		});

		it('should fail response time greater than test', async () => {
			const assertion: TestAssertion = {
				id: 'test-5',
				enabled: true,
				type: 'response-time',
				operator: 'less-than',
				expectedValue: 100,
				description: 'Response time should be under 100ms',
			};

			const suite: TestSuite = {
				id: 'suite-5',
				name: 'Performance Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('failed');
			expect(result.results[0].passed).toBe(false);
			expect(result.results[0].actualValue).toBe(145);
			expect(result.results[0].expectedValue).toBe(100);
		});
	});

	describe('Header Tests', () => {
		it('should pass header exists test', async () => {
			const assertion: TestAssertion = {
				id: 'test-6',
				enabled: true,
				type: 'header-exists',
				operator: 'exists',
				field: 'content-type',
				expectedValue: true,
				description: 'Content-Type header should exist',
			};

			const suite: TestSuite = {
				id: 'suite-6',
				name: 'Header Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
			expect(result.results[0].actualValue).toBe(true);
		});

		it('should fail header not exists test', async () => {
			const assertion: TestAssertion = {
				id: 'test-7',
				enabled: true,
				type: 'header-exists',
				operator: 'exists',
				field: 'x-missing-header',
				expectedValue: true, // We expect it to exist (but it doesn't)
				description: 'Missing header should exist',
			};

			const suite: TestSuite = {
				id: 'suite-7',
				name: 'Header Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			// Debug output
			// Should fail because header doesn't exist but we expect it to
			expect(result.status).toBe('failed');
			expect(result.results[0].passed).toBe(false);
			expect(result.results[0].actualValue).toBe(false);
		});

		it('should pass header value contains test', async () => {
			const assertion: TestAssertion = {
				id: 'test-8',
				enabled: true,
				type: 'header-value',
				operator: 'contains',
				field: 'content-type',
				expectedValue: 'json',
				description: 'Content-Type should contain json',
			};

			const suite: TestSuite = {
				id: 'suite-8',
				name: 'Header Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
			expect(result.results[0].actualValue).toBe('application/json');
		});

		it('should pass header value matches regex test', async () => {
			const assertion: TestAssertion = {
				id: 'test-9',
				enabled: true,
				type: 'header-value',
				operator: 'matches',
				field: 'server',
				expectedValue: 'nginx/.*',
				description: 'Server should match nginx pattern',
			};

			const suite: TestSuite = {
				id: 'suite-9',
				name: 'Header Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
			expect(result.results[0].actualValue).toBe('nginx/1.18.0');
		});
	});

	describe('JSON Path Tests', () => {
		it('should pass JSON path equals test', async () => {
			const assertion: TestAssertion = {
				id: 'test-10',
				enabled: true,
				type: 'json-path',
				operator: 'equals',
				field: 'status',
				expectedValue: 'success',
				description: 'Status should be success',
			};

			const suite: TestSuite = {
				id: 'suite-10',
				name: 'JSON Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
			expect(result.results[0].actualValue).toBe('success');
		});

		it('should pass nested JSON path test', async () => {
			const assertion: TestAssertion = {
				id: 'test-11',
				enabled: true,
				type: 'json-path',
				operator: 'equals',
				field: 'data.user.name',
				expectedValue: 'John Doe',
				description: 'User name should be John Doe',
			};

			const suite: TestSuite = {
				id: 'suite-11',
				name: 'JSON Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
			expect(result.results[0].actualValue).toBe('John Doe');
		});

		it('should pass JSON array length test', async () => {
			const assertion: TestAssertion = {
				id: 'test-12',
				enabled: true,
				type: 'json-array-length',
				operator: 'equals',
				field: 'data.items',
				expectedValue: 3,
				description: 'Items array should have 3 items',
			};

			const suite: TestSuite = {
				id: 'suite-12',
				name: 'JSON Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
			expect(result.results[0].actualValue).toBe(3);
		});

		it('should pass JSON property exists test', async () => {
			const assertion: TestAssertion = {
				id: 'test-13',
				enabled: true,
				type: 'json-property-exists',
				operator: 'exists',
				field: 'data.user.email',
				expectedValue: true,
				description: 'User email property should exist',
			};

			const suite: TestSuite = {
				id: 'suite-13',
				name: 'JSON Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
			expect(result.results[0].actualValue).toBe(true);
		});

		it('should fail JSON property not exists test', async () => {
			const assertion: TestAssertion = {
				id: 'test-14',
				enabled: true,
				type: 'json-property-exists',
				operator: 'exists',
				field: 'data.user.password',
				expectedValue: true,
				description: 'User password property should exist',
			};

			const suite: TestSuite = {
				id: 'suite-14',
				name: 'JSON Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('failed');
			expect(result.results[0].passed).toBe(false);
			expect(result.results[0].actualValue).toBe(false);
		});
	});

	describe('Response Body Tests', () => {
		it('should pass body contains test', async () => {
			const assertion: TestAssertion = {
				id: 'test-15',
				enabled: true,
				type: 'response-body-contains',
				operator: 'contains',
				expectedValue: 'success',
				description: 'Body should contain success',
			};

			const suite: TestSuite = {
				id: 'suite-15',
				name: 'Body Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
		});

		it('should fail body not contains test', async () => {
			const assertion: TestAssertion = {
				id: 'test-16',
				enabled: true,
				type: 'response-body-contains',
				operator: 'contains',
				expectedValue: 'error',
				description: 'Body should contain error',
			};

			const suite: TestSuite = {
				id: 'suite-16',
				name: 'Body Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('failed');
			expect(result.results[0].passed).toBe(false);
		});

		it('should pass body matches regex test', async () => {
			const assertion: TestAssertion = {
				id: 'test-17',
				enabled: true,
				type: 'response-body-matches',
				operator: 'matches',
				expectedValue: '"status"\\s*:\\s*"success"',
				description: 'Body should match status success pattern',
			};

			const suite: TestSuite = {
				id: 'suite-17',
				name: 'Body Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
		});
	});

	describe('Response Size Tests', () => {
		it('should pass response size test', async () => {
			const assertion: TestAssertion = {
				id: 'test-18',
				enabled: true,
				type: 'response-size',
				operator: 'greater-than',
				expectedValue: 100,
				description: 'Response size should be greater than 100 bytes',
			};

			const suite: TestSuite = {
				id: 'suite-18',
				name: 'Size Tests',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.results[0].passed).toBe(true);
			expect(result.results[0].actualValue).toBe(256);
		});
	});

	describe('Multiple Assertions', () => {
		it('should handle multiple passing assertions', async () => {
			const suite: TestSuite = {
				id: 'suite-multi-1',
				name: 'Multi Test Suite',
				enabled: true,
				assertions: [
					{
						id: 'test-19',
						enabled: true,
						type: 'status-code',
						operator: 'equals',
						expectedValue: 200,
						description: 'Status should be 200',
					},
					{
						id: 'test-20',
						enabled: true,
						type: 'response-time',
						operator: 'less-than',
						expectedValue: 1000,
						description: 'Response time should be fast',
					},
					{
						id: 'test-21',
						enabled: true,
						type: 'json-path',
						operator: 'equals',
						field: 'status',
						expectedValue: 'success',
						description: 'Status should be success',
					},
				],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.totalTests).toBe(3);
			expect(result.passedTests).toBe(3);
			expect(result.failedTests).toBe(0);
		});

		it('should handle mixed passing and failing assertions', async () => {
			const suite: TestSuite = {
				id: 'suite-multi-2',
				name: 'Mixed Test Suite',
				enabled: true,
				assertions: [
					{
						id: 'test-22',
						enabled: true,
						type: 'status-code',
						operator: 'equals',
						expectedValue: 200,
						description: 'Status should be 200',
					},
					{
						id: 'test-23',
						enabled: true,
						type: 'response-time',
						operator: 'less-than',
						expectedValue: 50, // This will fail
						description: 'Response time should be very fast',
					},
					{
						id: 'test-24',
						enabled: true,
						type: 'json-path',
						operator: 'equals',
						field: 'status',
						expectedValue: 'error', // This will fail
						description: 'Status should be error',
					},
				],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('failed');
			expect(result.totalTests).toBe(3);
			expect(result.passedTests).toBe(1);
			expect(result.failedTests).toBe(2);
		});

		it('should skip disabled assertions', async () => {
			const suite: TestSuite = {
				id: 'suite-disabled',
				name: 'Disabled Test Suite',
				enabled: true,
				assertions: [
					{
						id: 'test-25',
						enabled: true,
						type: 'status-code',
						operator: 'equals',
						expectedValue: 200,
						description: 'Status should be 200',
					},
					{
						id: 'test-26',
						enabled: false, // Disabled
						type: 'response-time',
						operator: 'less-than',
						expectedValue: 50,
						description: 'Response time should be very fast',
					},
				],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.totalTests).toBe(1); // Only enabled tests count
			expect(result.passedTests).toBe(1);
			expect(result.failedTests).toBe(0);
		});

		it('should handle disabled test suite', async () => {
			const suite: TestSuite = {
				id: 'suite-disabled-suite',
				name: 'Disabled Suite',
				enabled: false, // Entire suite disabled
				assertions: [
					{
						id: 'test-27',
						enabled: true,
						type: 'status-code',
						operator: 'equals',
						expectedValue: 200,
						description: 'Status should be 200',
					},
				],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.totalTests).toBe(0);
			expect(result.passedTests).toBe(0);
			expect(result.failedTests).toBe(0);
			expect(result.results).toHaveLength(0);
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle invalid JSON path gracefully', async () => {
			const assertion: TestAssertion = {
				id: 'test-invalid-path',
				enabled: true,
				type: 'json-path',
				operator: 'equals',
				field: 'non.existing.path',
				expectedValue: 'value',
				description: 'Non-existing path test',
			};

			const suite: TestSuite = {
				id: 'suite-invalid',
				name: 'Invalid Path Suite',
				enabled: true,
				assertions: [assertion],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('failed');
			expect(result.results[0].passed).toBe(false);
			expect(result.results[0].actualValue).toBeUndefined();
		});

		it('should handle empty test suite', async () => {
			const suite: TestSuite = {
				id: 'suite-empty',
				name: 'Empty Suite',
				enabled: true,
				assertions: [],
			};

			const result = await executor.executeTestSuite(suite, mockResponseData);

			expect(result.status).toBe('passed');
			expect(result.totalTests).toBe(0);
			expect(result.passedTests).toBe(0);
			expect(result.failedTests).toBe(0);
		});
	});
});

describe('createResponseTestData', () => {
	it('should create response data from fetch Response', async () => {
		const mockResponse = new (global as any).Response(JSON.stringify({ message: 'test' }), {
			status: 200,
			statusText: 'OK',
			headers: {
				'Content-Type': 'application/json',
				'X-Custom': 'test-value',
			},
		});

		const responseData = await createResponseTestData(mockResponse as any, 123);

		expect(responseData.status).toBe(200);
		expect(responseData.statusText).toBe('OK');
		expect(responseData.headers['content-type']).toBe('application/json');
		expect(responseData.headers['x-custom']).toBe('test-value');
		expect(responseData.body).toBe('{"message":"test"}');
		expect(responseData.contentType).toBe('application/json');
		expect(responseData.responseTime).toBe(123);
		expect(responseData.size).toBe(18); // Length of JSON string
		expect(responseData.data).toEqual({ message: 'test' });
	});

	it('should handle non-JSON response', async () => {
		const mockResponse = new (global as any).Response('plain text response', {
			status: 200,
			statusText: 'OK',
			headers: {
				'Content-Type': 'text/plain',
			},
		});

		const responseData = await createResponseTestData(mockResponse as any, 89);

		expect(responseData.status).toBe(200);
		expect(responseData.body).toBe('plain text response');
		expect(responseData.contentType).toBe('text/plain');
		expect(responseData.data).toBeUndefined();
	});
});
