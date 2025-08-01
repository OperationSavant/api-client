import { validateAuth } from '../utils/auth';
import { AuthConfig } from '../types/auth';

describe('Authentication Validation', () => {
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

		it('should handle no authentication', () => {
			const noAuth: AuthConfig = { type: 'none' };
			expect(validateAuth(noAuth)).toEqual([]);
		});
	});
});
