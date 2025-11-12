import { parseCurlCommand, generateCurlCommand, validateCurlCommand } from '@/lib/curl';

describe('cURL Integration', () => {
	describe('parseCurlCommand', () => {
		test('should parse simple GET request', () => {
			const curl = 'curl https://api.example.com/users';
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.url).toBe('https://api.example.com/users');
			expect(result.method).toBe('GET');
			expect(result.headers).toEqual({});
			expect(result.errors).toHaveLength(0);
		});

		test('should parse POST request with JSON data', () => {
			const curl = `curl -X POST https://api.example.com/users \\
				-H "Content-Type: application/json" \\
				-d '{"name": "John Doe", "email": "john@example.com"}'`;
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.url).toBe('https://api.example.com/users');
			expect(result.method).toBe('POST');
			expect(result.headers['Content-Type']).toBe('application/json');
			expect(result.body?.type).toBe('raw');
			expect(result.body?.raw.language).toBe('json');
			expect(result.body?.raw.content).toBe('{"name": "John Doe", "email": "john@example.com"}');
		});

		test('should parse request with multiple headers', () => {
			const curl = `curl -H "Authorization: Bearer token123" \\
				-H "Accept: application/json" \\
				-H "User-Agent: MyApp/1.0" \\
				https://api.example.com/data`;
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.headers['Authorization']).toBe('Bearer token123');
			expect(result.headers['Accept']).toBe('application/json');
			expect(result.headers['User-Agent']).toBe('MyApp/1.0');
		});

		test('should parse basic authentication', () => {
			const curl = 'curl -u username:password https://api.example.com/secure';
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.auth?.type).toBe('basic');
			expect(result.auth?.credentials.username).toBe('username');
			expect(result.auth?.credentials.password).toBe('password');
		});

		test('should parse bearer token from header', () => {
			const curl = 'curl -H "Authorization: Bearer token123" https://api.example.com/data';
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.auth?.type).toBe('bearer');
			expect(result.auth?.credentials.token).toBe('token123');
			expect(result.auth?.credentials.prefix).toBe('Bearer');
		});

		test('should parse form data', () => {
			const curl = `curl -X POST https://api.example.com/form \\
				-H "Content-Type: application/x-www-form-urlencoded" \\
				-d "name=John&email=john@example.com&age=30"`;
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.body?.type).toBe('x-www-form-urlencoded');
			expect(result.body?.urlEncoded).toHaveLength(3);
			expect(result.body?.urlEncoded[0]).toEqual({ key: 'name', value: 'John', enabled: true });
			expect(result.body?.urlEncoded[1]).toEqual({ key: 'email', value: 'john@example.com', enabled: true });
			expect(result.body?.urlEncoded[2]).toEqual({ key: 'age', value: '30', enabled: true });
		});

		test('should parse XML data', () => {
			const curl = `curl -X POST https://api.example.com/xml \\
				-H "Content-Type: application/xml" \\
				-d '<user><name>John</name><email>john@example.com</email></user>'`;
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.body?.type).toBe('raw');
			expect(result.body?.raw.language).toBe('xml');
			expect(result.body?.raw.content).toBe('<user><name>John</name><email>john@example.com</email></user>');
		});

		test('should handle quoted URLs and data', () => {
			const curl = `curl -X POST "https://api.example.com/users" \\
				-H "Content-Type: application/json" \\
				-d "{\\"name\\": \\"John Doe\\", \\"email\\": \\"john@example.com\\"}"`;
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.url).toBe('https://api.example.com/users');
			expect(result.body?.raw.content).toBe('{"name": "John Doe", "email": "john@example.com"}');
		});

		test('should handle line continuations', () => {
			const curl = `curl -X POST \\
				https://api.example.com/users \\
				-H "Content-Type: application/json" \\
				-d '{"name": "John"}'`;
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.url).toBe('https://api.example.com/users');
			expect(result.method).toBe('POST');
		});

		test('should handle empty command', () => {
			const result = parseCurlCommand('');
			expect(result.success).toBe(false);
			expect(result.errors).toContain('cURL command cannot be empty');
		});

		test('should handle invalid command', () => {
			const result = parseCurlCommand('wget https://example.com');
			expect(result.success).toBe(false);
			expect(result.errors).toContain('Command must start with "curl "');
		});

		test('should handle command without URL', () => {
			const result = parseCurlCommand('curl -X POST -H "Content-Type: application/json"');
			expect(result.success).toBe(false);
			expect(result.errors).toContain('No valid URL found in cURL command');
		});

		test('should parse localhost URLs', () => {
			const curl = 'curl http://localhost:3000/api/test';
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.url).toBe('http://localhost:3000/api/test');
		});

		test('should parse IP addresses', () => {
			const curl = 'curl http://192.168.1.100:8080/api';
			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.url).toBe('http://192.168.1.100:8080/api');
		});
	});

	describe('generateCurlCommand', () => {
		test('should generate simple GET request', () => {
			const result = generateCurlCommand({
				url: 'https://api.example.com/users',
				method: 'GET',
			});

			expect(result).toBe('curl "https://api.example.com/users"');
		});

		test('should generate POST request with headers', () => {
			const result = generateCurlCommand({
				url: 'https://api.example.com/users',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			});

			expect(result).toContain('-X POST');
			expect(result).toContain('-H "Content-Type: application/json"');
			expect(result).toContain('-H "Accept: application/json"');
			expect(result).toContain('"https://api.example.com/users"');
		});

		test('should generate request with basic auth', () => {
			const result = generateCurlCommand({
				url: 'https://api.example.com/secure',
				method: 'GET',
				auth: {
					type: 'basic',
					credentials: {
						username: 'user',
						password: 'pass',
					},
				},
			});

			expect(result).toContain('-u "user:pass"');
		});

		test('should generate request with bearer token', () => {
			const result = generateCurlCommand({
				url: 'https://api.example.com/data',
				method: 'GET',
				auth: {
					type: 'bearer',
					credentials: {
						token: 'token123',
						prefix: 'Bearer',
					},
				},
			});

			expect(result).toContain('-H "Authorization: Bearer token123"');
		});

		test('should generate request with API key', () => {
			const result = generateCurlCommand({
				url: 'https://api.example.com/data',
				method: 'GET',
				auth: {
					type: 'api-key',
					credentials: {
						key: 'X-API-Key',
						value: 'apikey123',
					},
				},
			});

			expect(result).toContain('-H "X-API-Key: apikey123"');
		});

		test('should generate request with JSON body', () => {
			const result = generateCurlCommand({
				url: 'https://api.example.com/users',
				method: 'POST',
				body: {
					type: 'raw',
					formData: [],
					urlEncoded: [],
					raw: {
						content: '{"name": "John", "email": "john@example.com"}',
						language: 'json',
						autoFormat: true,
					},
					binary: {},
					graphql: { query: '', variables: '' },
				},
			});

			expect(result).toContain('-d "{\\"name\\": \\"John\\", \\"email\\": \\"john@example.com\\"}"');
		});

		test('should generate request with form data', () => {
			const result = generateCurlCommand({
				url: 'https://api.example.com/form',
				method: 'POST',
				body: {
					type: 'x-www-form-urlencoded',
					formData: [],
					urlEncoded: [
						{ key: 'name', value: 'John', checked: true },
						{ key: 'email', value: 'john@example.com', checked: true },
						{ key: 'disabled', value: 'test', checked: false },
					],
					raw: { content: '', language: 'text', autoFormat: false },
					binary: {},
					graphql: { query: '', variables: '' },
				},
			});

			expect(result).toContain('-d "name=John&email=john%40example.com"');
			expect(result).not.toContain('disabled=test'); // Should skip disabled fields
		});

		test('should generate request with GraphQL body', () => {
			const result = generateCurlCommand({
				url: 'https://api.example.com/graphql',
				method: 'POST',
				body: {
					type: 'graphql',
					formData: [],
					urlEncoded: [],
					raw: { content: '', language: 'text', autoFormat: false },
					binary: {},
					graphql: {
						query: 'query GetUser($id: ID!) { user(id: $id) { name email } }',
						variables: '{"id": "123"}',
						operationName: 'GetUser',
					},
				},
			});

			expect(result).toContain('-d');
			expect(result).toContain('GetUser');
		});

		test('should include common options', () => {
			const result = generateCurlCommand({
				url: 'https://api.example.com/data',
				method: 'GET',
				compressed: true,
				followRedirects: true,
				insecure: true,
				includeHeaders: true,
			});

			expect(result).toContain('--compressed');
			expect(result).toContain('-L');
			expect(result).toContain('-k');
			expect(result).toContain('-i');
		});

		test('should not include method for GET requests', () => {
			const result = generateCurlCommand({
				url: 'https://api.example.com/users',
				method: 'GET',
			});

			expect(result).not.toContain('-X GET');
			expect(result).toBe('curl "https://api.example.com/users"');
		});
	});

	describe('validateCurlCommand', () => {
		test('should validate correct command', () => {
			const result = validateCurlCommand('curl https://api.example.com');
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test('should reject empty command', () => {
			const result = validateCurlCommand('');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('cURL command cannot be empty');
		});

		test('should reject non-curl command', () => {
			const result = validateCurlCommand('wget https://example.com');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Command must start with "curl "');
		});

		test('should detect unmatched quotes', () => {
			const result1 = validateCurlCommand('curl "https://example.com');
			expect(result1.valid).toBe(false);
			expect(result1.errors).toContain('Unmatched double quotes in command');

			const result2 = validateCurlCommand("curl 'https://example.com");
			expect(result2.valid).toBe(false);
			expect(result2.errors).toContain('Unmatched single quotes in command');
		});

		test('should accept matched quotes', () => {
			const result = validateCurlCommand('curl "https://example.com" -H "Accept: application/json"');
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});
	});

	describe('Complex curl parsing scenarios', () => {
		test('should parse complex real-world curl command', () => {
			const curl = `curl -X POST 'https://api.github.com/repos/owner/repo/issues' \\
				-H 'Accept: application/vnd.github.v3+json' \\
				-H 'Authorization: token ghp_xxxxxxxxxxxxxxxxxxxx' \\
				-H 'Content-Type: application/json' \\
				-d '{
					"title": "Found a bug",
					"body": "Something is not working correctly",
					"assignees": ["user1", "user2"],
					"labels": ["bug", "urgent"]
				}'`;

			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.url).toBe('https://api.github.com/repos/owner/repo/issues');
			expect(result.method).toBe('POST');
			expect(result.headers['Accept']).toBe('application/vnd.github.v3+json');
			expect(result.auth?.type).toBe('bearer');
			expect(result.auth?.credentials.token).toBe('ghp_xxxxxxxxxxxxxxxxxxxx');
			expect(result.body?.type).toBe('raw');
			expect(result.body?.raw.language).toBe('json');
		});

		test('should handle curl with form data and file upload syntax', () => {
			const curl = `curl -X POST https://api.example.com/upload \\
				-F "file=@/path/to/file.jpg" \\
				-F "name=John Doe" \\
				-F "description=Profile picture"`;

			const result = parseCurlCommand(curl);

			expect(result.success).toBe(true);
			expect(result.method).toBe('POST');
			// Note: Our current implementation doesn't fully support -F flags yet
			// This test documents the expected behavior for future enhancement
		});
	});
});
