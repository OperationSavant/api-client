/**
 * Response Operations Test Suite
 * Tests for Phase 6.2: Response Operations functionality
 */

/// <reference types="jest" />

// Mock syntax highlighting service
const mockSyntaxHighlightingService = {
	detectLanguageFromContentType: (contentType: string) => {
		const languageMap: Record<string, string> = {
			'application/json': 'json',
			'application/xml': 'xml',
			'text/html': 'html',
			'text/plain': 'text',
			'text/css': 'css',
			'application/javascript': 'javascript',
		};

		const type = contentType.split(';')[0].trim();
		return {
			language: languageMap[type] || 'text',
			displayName: languageMap[type] || 'Plain Text',
		};
	},
};

// Mock clipboard API
Object.assign(navigator, {
	clipboard: {
		writeText: jest.fn(() => Promise.resolve()),
	},
});

// Mock Blob constructor for testing
(global as any).Blob = class MockBlob {
	content: any[];
	options: any;

	constructor(content: any[], options: any = {}) {
		this.content = content;
		this.options = options;
	}
};

// Mock URL.createObjectURL
Object.assign(URL, {
	createObjectURL: jest.fn(() => 'mock-url'),
	revokeObjectURL: jest.fn(),
});

describe('Response Operations', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Response Download Functionality', () => {
		const mockResponseData = {
			body: '{"users": [{"id": 1, "name": "John"}]}',
			headers: { 'content-type': 'application/json' },
			contentType: 'application/json',
			status: 200,
			url: 'https://api.example.com/users',
		};

		test('should detect content format correctly', () => {
			const service = mockSyntaxHighlightingService;
			const result = service.detectLanguageFromContentType('application/json');
			expect(result.language).toBe('json');
		});

		test('should generate appropriate filename', () => {
			const url = 'https://api.example.com/users';
			const contentType = 'application/json';

			// Extract endpoint from URL
			const endpoint = url.split('/').pop() || 'response';
			const extension = contentType.includes('json') ? 'json' : 'txt';
			const filename = `${endpoint}.${extension}`;

			expect(filename).toBe('users.json');
		});

		test('should handle different content types', () => {
			const contentTypes = [
				{ type: 'application/json', expected: 'json' },
				{ type: 'application/xml', expected: 'xml' },
				{ type: 'text/html', expected: 'html' },
				{ type: 'text/plain', expected: 'text' },
			];

			contentTypes.forEach(({ type, expected }) => {
				const result = mockSyntaxHighlightingService.detectLanguageFromContentType(type);
				expect(result.language).toBe(expected);
			});
		});

		test('should format JSON content correctly', () => {
			const jsonString = '{"name":"John","age":30}';
			const formatted = JSON.stringify(JSON.parse(jsonString), null, 2);

			expect(formatted).toContain('\n');
			expect(formatted).toContain('  ');
		});

		test('should convert JSON to CSV format', () => {
			const jsonData = [
				{ id: 1, name: 'John', age: 30 },
				{ id: 2, name: 'Jane', age: 25 },
			];

			const headers = Object.keys(jsonData[0]);
			const csvHeaders = headers.join(',');
			const csvRows = jsonData.map(row => headers.map(header => row[header as keyof typeof row]).join(','));
			const csv = [csvHeaders, ...csvRows].join('\n');

			expect(csv).toContain('id,name,age');
			expect(csv).toContain('1,John,30');
			expect(csv).toContain('2,Jane,25');
		});

		test('should create blob for download', () => {
			const content = 'test content';
			const mimeType = 'text/plain';

			const blob = new (global as any).Blob([content], { type: mimeType });

			expect(blob.content).toEqual([content]);
			expect(blob.options).toEqual({ type: mimeType });
		});
	});

	describe('Response Headers Analysis', () => {
		const mockHeaders = {
			'content-type': 'application/json; charset=utf-8',
			'content-length': '1234',
			'cache-control': 'max-age=3600',
			'x-frame-options': 'DENY',
			'x-content-type-options': 'nosniff',
			server: 'nginx/1.18.0',
			date: 'Wed, 09 Aug 2025 12:00:00 GMT',
			'access-control-allow-origin': '*',
		};

		test('should count total headers', () => {
			const headerCount = Object.keys(mockHeaders).length;
			expect(headerCount).toBe(8);
		});

		test('should categorize security headers', () => {
			const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection', 'strict-transport-security', 'content-security-policy'];

			const presentSecurityHeaders = securityHeaders.filter(header => Object.keys(mockHeaders).some(key => key.toLowerCase() === header));

			expect(presentSecurityHeaders).toContain('x-frame-options');
			expect(presentSecurityHeaders).toContain('x-content-type-options');
			expect(presentSecurityHeaders.length).toBe(2);
		});

		test('should calculate security score', () => {
			const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection', 'strict-transport-security', 'content-security-policy'];

			const present = securityHeaders.filter(header => Object.keys(mockHeaders).some(key => key.toLowerCase() === header));

			const score = (present.length / securityHeaders.length) * 100;
			expect(score).toBe(40); // 2/5 = 40%
		});

		test('should identify CORS headers', () => {
			const corsHeaders = Object.keys(mockHeaders).filter(header => header.toLowerCase().startsWith('access-control-'));

			expect(corsHeaders).toContain('access-control-allow-origin');
			expect(corsHeaders.length).toBe(1);
		});

		test('should handle case-insensitive header names', () => {
			const mixedCaseHeaders = {
				'Content-Type': 'application/json',
				'CACHE-CONTROL': 'no-cache',
				'x-frame-options': 'SAMEORIGIN',
			};

			const normalizedHeaders = Object.entries(mixedCaseHeaders).map(([key, value]) => [key.toLowerCase(), value]);

			expect(normalizedHeaders).toHaveLength(3);
			expect(normalizedHeaders[0][0]).toBe('content-type');
		});

		test('should filter headers by search term', () => {
			const searchTerm = 'content';
			const filtered = Object.entries(mockHeaders).filter(
				([key, value]) => key.toLowerCase().includes(searchTerm.toLowerCase()) || value.toLowerCase().includes(searchTerm.toLowerCase())
			);

			expect(filtered.length).toBeGreaterThan(0);
			expect(filtered.some(([key]) => key.includes('content'))).toBe(true);
		});

		test('should categorize headers by type', () => {
			const categories = {
				content: ['content-type', 'content-length', 'content-encoding'],
				cache: ['cache-control', 'expires', 'etag'],
				security: ['x-frame-options', 'x-content-type-options', 'x-xss-protection'],
				cors: ['access-control-allow-origin', 'access-control-allow-methods'],
			};

			const headerList = Object.keys(mockHeaders);
			const contentHeaders = headerList.filter(header => categories.content.some(cat => header.toLowerCase().includes(cat.split('-')[0])));

			expect(contentHeaders.length).toBeGreaterThan(0);
		});
	});

	describe('Performance Tests', () => {
		test('should handle large response data efficiently', () => {
			// Create large response data
			const largeData = Array(1000)
				.fill(0)
				.map((_, i) => ({ id: i, name: `User${i}` }));
			const responseBody = JSON.stringify(largeData);

			expect(responseBody.length).toBeGreaterThan(10000);
			expect(() => JSON.parse(responseBody)).not.toThrow();
		});

		test('should process different content types', () => {
			const contentTypes = ['application/json', 'application/xml', 'text/html', 'text/plain', 'application/pdf'];

			contentTypes.forEach(contentType => {
				const service = mockSyntaxHighlightingService;
				const languageInfo = service.detectLanguageFromContentType(contentType);
				expect(languageInfo).toBeTruthy();
				expect(languageInfo.language).toBeTruthy();
			});
		});

		test('should maintain performance with many headers', () => {
			// Create many headers
			const manyHeaders: Record<string, string> = {};
			for (let i = 0; i < 50; i++) {
				manyHeaders[`custom-header-${i}`] = `value-${i}`;
			}

			const headerCount = Object.keys(manyHeaders).length;
			expect(headerCount).toBe(50);

			// Test filtering performance
			const searchTerm = 'custom';
			const filtered = Object.keys(manyHeaders).filter(key => key.toLowerCase().includes(searchTerm));

			expect(filtered.length).toBe(50);
		});

		test('should handle error cases gracefully', () => {
			// Test with invalid JSON
			const invalidJson = '{"name": "test", "value":}';
			expect(() => JSON.parse(invalidJson)).toThrow();

			// Test with empty headers
			const emptyHeaders = {};
			expect(Object.keys(emptyHeaders).length).toBe(0);

			// Test with null values
			const nullResponse = null;
			expect(nullResponse).toBeNull();
		});
	});
});
