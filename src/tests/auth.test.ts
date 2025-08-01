import { applyAuthentication, validateAuth, generateOAuth2Token } from '../utils/auth';
import { AuthConfig } from '../types/auth';

// Mock fetch for OAuth tests
global.fetch = jest.fn();

describe('Authentication Utils', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('applyAuthentication', () => {
		const mockMethod = 'GET';
		const mockUrl = 'https://api.example.com/data';
		const mockHeaders = { 'Content-Type': 'application/json' };
		const mockParams = { page: '1' };
		const mockBody = '{"test": true}';

		it('should handle no authentication', async () => {
			const auth: AuthConfig = { type: 'none' };

			const result = await applyAuthentication(auth, mockMethod, mockUrl, mockHeaders, mockParams, mockBody);

			expect(result.headers).toEqual(mockHeaders);
			expect(result.params).toEqual(mockParams);
		});

		it('should apply Basic Authentication', async () => {
			const auth: AuthConfig = {
				type: 'basic',
				basic: { username: 'testuser', password: 'testpass', showPassword: false },
			};

			const result = await applyAuthentication(auth, mockMethod, mockUrl, mockHeaders, mockParams, mockBody);

			expect(result.headers['Authorization']).toBe('Basic dGVzdHVzZXI6dGVzdHBhc3M=');
			expect(result.headers['Content-Type']).toBe('application/json');
		});

		it('should apply Bearer Token Authentication', async () => {
			const auth: AuthConfig = {
				type: 'bearer',
				bearer: { token: 'abc123', prefix: 'Bearer' },
			};

			const result = await applyAuthentication(auth, mockMethod, mockUrl, mockHeaders, mockParams, mockBody);

			expect(result.headers['Authorization']).toBe('Bearer abc123');
		});

		it('should apply Bearer Token with custom prefix', async () => {
			const auth: AuthConfig = {
				type: 'bearer',
				bearer: { token: 'xyz789', prefix: 'Token' },
			};

			const result = await applyAuthentication(auth, mockMethod, mockUrl, mockHeaders, mockParams, mockBody);

			expect(result.headers['Authorization']).toBe('Token xyz789');
		});

		it('should apply API Key to headers', async () => {
			const auth: AuthConfig = {
				type: 'apikey',
				apikey: { key: 'X-API-Key', value: 'secret123', addTo: 'header' },
			};

			const result = await applyAuthentication(auth, mockMethod, mockUrl, mockHeaders, mockParams, mockBody);

			expect(result.headers['X-API-Key']).toBe('secret123');
		});

		it('should apply API Key to query parameters', async () => {
			const auth: AuthConfig = {
				type: 'apikey',
				apikey: { key: 'api_key', value: 'secret456', addTo: 'query' },
			};

			const result = await applyAuthentication(auth, mockMethod, mockUrl, mockHeaders, mockParams, mockBody);

			expect(result.params['api_key']).toBe('secret456');
			expect(result.params['page']).toBe('1'); // Preserve existing params
		});

		it('should apply OAuth 2.0 with access token', async () => {
			const auth: AuthConfig = {
				type: 'oauth2',
				oauth2: {
					tokenUrl: 'https://auth.example.com/token',
					clientId: 'client123',
					clientSecret: 'secret123',
					grantType: 'client_credentials',
					scope: 'read',
					clientAuth: 'header',
					accessToken: 'oauth_token_123',
				},
			};

			const result = await applyAuthentication(auth, mockMethod, mockUrl, mockHeaders, mockParams, mockBody);

			expect(result.headers['Authorization']).toBe('Bearer oauth_token_123');
		});
	});

	describe('validateAuth', () => {
		it('should validate Basic Auth', () => {
			const validAuth: AuthConfig = {
				type: 'basic',
				basic: { username: 'user', password: 'pass', showPassword: false },
			};

			expect(validateAuth(validAuth)).toEqual([]);

			const invalidAuth: AuthConfig = {
				type: 'basic',
				basic: { username: '', password: 'pass', showPassword: false },
			};

			const errors = validateAuth(invalidAuth);
			expect(errors).toContain('Username is required for Basic Auth');
		});

		it('should validate Bearer Token Auth', () => {
			const validAuth: AuthConfig = {
				type: 'bearer',
				bearer: { token: 'token123', prefix: 'Bearer' },
			};

			expect(validateAuth(validAuth)).toEqual([]);

			const invalidAuth: AuthConfig = {
				type: 'bearer',
				bearer: { token: '', prefix: 'Bearer' },
			};

			const errors = validateAuth(invalidAuth);
			expect(errors).toContain('Token is required for Bearer Auth');
		});

		it('should validate API Key Auth', () => {
			const validAuth: AuthConfig = {
				type: 'apikey',
				apikey: { key: 'X-API-Key', value: 'secret', addTo: 'header' },
			};

			expect(validateAuth(validAuth)).toEqual([]);

			const invalidAuth: AuthConfig = {
				type: 'apikey',
				apikey: { key: '', value: 'secret', addTo: 'header' },
			};

			const errors = validateAuth(invalidAuth);
			expect(errors).toContain('Key name is required for API Key Auth');
		});

		it('should validate OAuth 2.0 Auth', () => {
			const validAuth: AuthConfig = {
				type: 'oauth2',
				oauth2: {
					tokenUrl: 'https://auth.example.com/token',
					clientId: 'client123',
					clientSecret: 'secret123',
					grantType: 'client_credentials',
					scope: 'read',
					clientAuth: 'header',
				},
			};

			expect(validateAuth(validAuth)).toEqual([]);

			const invalidAuth: AuthConfig = {
				type: 'oauth2',
				oauth2: {
					tokenUrl: '',
					clientId: 'client123',
					clientSecret: 'secret123',
					grantType: 'client_credentials',
					scope: 'read',
					clientAuth: 'header',
				},
			};

			const errors = validateAuth(invalidAuth);
			expect(errors).toContain('Token URL is required for OAuth 2.0');
		});

		it('should validate AWS Auth', () => {
			const validAuth: AuthConfig = {
				type: 'aws',
				aws: {
					accessKey: 'AKIA123',
					secretKey: 'secret123',
					sessionToken: 'session123',
					region: 'us-east-1',
					service: 's3',
				},
			};

			expect(validateAuth(validAuth)).toEqual([]);

			const invalidAuth: AuthConfig = {
				type: 'aws',
				aws: {
					accessKey: '',
					secretKey: 'secret123',
					sessionToken: 'session123',
					region: 'us-east-1',
					service: 's3',
				},
			};

			const errors = validateAuth(invalidAuth);
			expect(errors).toContain('Access Key is required for AWS Auth');
		});
	});

	describe('generateOAuth2Token', () => {
		beforeEach(() => {
			(global.fetch as jest.Mock).mockClear();
		});

		it('should generate OAuth 2.0 token with client credentials', async () => {
			const mockResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue({ access_token: 'new_token_123' }),
			};
			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);

			const auth: AuthConfig = {
				type: 'oauth2',
				oauth2: {
					tokenUrl: 'https://auth.example.com/token',
					clientId: 'client123',
					clientSecret: 'secret123',
					grantType: 'client_credentials',
					scope: 'read write',
					clientAuth: 'header',
				},
			};

			const token = await generateOAuth2Token(auth);

			expect(token).toBe('new_token_123');
			expect(global.fetch).toHaveBeenCalledWith(
				'https://auth.example.com/token',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: 'Basic Y2xpZW50MTIzOnNlY3JldDEyMw==',
					}),
				})
			);
		});

		it('should generate OAuth 2.0 token with password grant', async () => {
			const mockResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue({ access_token: 'password_token_456' }),
			};
			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);

			const auth: AuthConfig = {
				type: 'oauth2',
				oauth2: {
					tokenUrl: 'https://auth.example.com/token',
					clientId: 'client123',
					clientSecret: 'secret123',
					grantType: 'password',
					scope: 'read',
					clientAuth: 'body',
					username: 'testuser',
					password: 'testpass',
				},
			};

			const token = await generateOAuth2Token(auth);

			expect(token).toBe('password_token_456');
			expect(global.fetch).toHaveBeenCalledWith(
				'https://auth.example.com/token',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/x-www-form-urlencoded',
					}),
				})
			);
		});

		it('should handle OAuth 2.0 token request failure', async () => {
			const mockResponse = {
				ok: false,
				status: 401,
				statusText: 'Unauthorized',
			};
			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);

			const auth: AuthConfig = {
				type: 'oauth2',
				oauth2: {
					tokenUrl: 'https://auth.example.com/token',
					clientId: 'client123',
					clientSecret: 'secret123',
					grantType: 'client_credentials',
					scope: 'read',
					clientAuth: 'header',
				},
			};

			await expect(generateOAuth2Token(auth)).rejects.toThrow('Token request failed: 401 Unauthorized');
		});

		it('should handle missing access token in response', async () => {
			const mockResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue({ error: 'invalid_request' }),
			};
			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);

			const auth: AuthConfig = {
				type: 'oauth2',
				oauth2: {
					tokenUrl: 'https://auth.example.com/token',
					clientId: 'client123',
					clientSecret: 'secret123',
					grantType: 'client_credentials',
					scope: 'read',
					clientAuth: 'header',
				},
			};

			await expect(generateOAuth2Token(auth)).rejects.toThrow('No access token received');
		});
	});
});
