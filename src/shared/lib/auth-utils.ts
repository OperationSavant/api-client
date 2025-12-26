import type { AuthConfig } from '@/shared/types/auth';

export function validateAuth(auth: AuthConfig): string[] {
	const errors: string[] = [];

	switch (auth.type) {
		case 'basic':
			if (!auth.basic?.username) {
				errors.push('Username is required for Basic Auth');
			}
			if (!auth.basic?.password) {
				errors.push('Password is required for Basic Auth');
			}
			break;

		case 'bearer':
			if (!auth.bearer?.token) {
				errors.push('Token is required for Bearer Auth');
			}
			break;

		case 'apikey':
			if (!auth.apikey?.key) {
				errors.push('Key name is required for API Key Auth');
			}
			if (!auth.apikey?.value) {
				errors.push('Key value is required for API Key Auth');
			}
			break;

		case 'oauth2':
			if (!auth.oauth2?.tokenUrl) {
				errors.push('Token URL is required for OAuth 2.0');
			}
			if (!auth.oauth2?.clientId) {
				errors.push('Client ID is required for OAuth 2.0');
			}
			if (!auth.oauth2?.clientSecret) {
				errors.push('Client Secret is required for OAuth 2.0');
			}
			if (auth.oauth2?.grantType === 'password') {
				if (!auth.oauth2?.username) {
					errors.push('Username is required for Password Grant');
				}
				if (!auth.oauth2?.password) {
					errors.push('Password is required for Password Grant');
				}
			}
			break;

		case 'aws':
			if (!auth.aws?.accessKey) {
				errors.push('Access Key is required for AWS Auth');
			}
			if (!auth.aws?.secretKey) {
				errors.push('Secret Key is required for AWS Auth');
			}
			if (!auth.aws?.region) {
				errors.push('Region is required for AWS Auth');
			}
			if (!auth.aws?.service) {
				errors.push('Service is required for AWS Auth');
			}
			break;
	}

	return errors;
}

// Helper: build auth header string (pure function)
export function buildBasicAuthCredentials(username: string, password: string): string {
	// Return unencoded string - let caller encode
	return `${username}:${password}`;
}
