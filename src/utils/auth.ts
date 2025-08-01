import { AuthConfig } from '@/types/auth';
import { createAwsSignature } from './awsSignature';

/**
 * Apply authentication to request headers and parameters
 */
export async function applyAuthentication(
	auth: AuthConfig,
	method: string,
	url: string,
	headers: Record<string, string>,
	params: Record<string, string>,
	body: string = ''
): Promise<{
	headers: Record<string, string>;
	params: Record<string, string>;
}> {
	const newHeaders = { ...headers };
	const newParams = { ...params };

	switch (auth.type) {
		case 'basic':
			if (auth.basic) {
				const credentials = btoa(`${auth.basic.username}:${auth.basic.password}`);
				newHeaders['Authorization'] = `Basic ${credentials}`;
			}
			break;

		case 'bearer':
			if (auth.bearer) {
				newHeaders['Authorization'] = `${auth.bearer.prefix} ${auth.bearer.token}`;
			}
			break;

		case 'apikey':
			if (auth.apikey) {
				if (auth.apikey.addTo === 'header') {
					newHeaders[auth.apikey.key] = auth.apikey.value;
				} else {
					newParams[auth.apikey.key] = auth.apikey.value;
				}
			}
			break;

		case 'oauth2':
			if (auth.oauth2?.accessToken) {
				newHeaders['Authorization'] = `Bearer ${auth.oauth2.accessToken}`;
			}
			break;

		case 'aws':
			if (auth.aws) {
				try {
					const awsHeaders = await createAwsSignature(
						method,
						url,
						newHeaders,
						body,
						auth.aws.accessKey,
						auth.aws.secretKey,
						auth.aws.sessionToken,
						auth.aws.region,
						auth.aws.service
					);
					Object.assign(newHeaders, awsHeaders);
				} catch (error) {
					console.error('AWS signature generation failed:', error);
					throw new Error('Failed to generate AWS signature');
				}
			}
			break;

		default:
			// No authentication
			break;
	}

	return { headers: newHeaders, params: newParams };
}

/**
 * Validate authentication configuration
 */
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

/**
 * Generate OAuth 2.0 access token
 */
export async function generateOAuth2Token(auth: AuthConfig): Promise<string> {
	if (auth.type !== 'oauth2' || !auth.oauth2) {
		throw new Error('Invalid OAuth 2.0 configuration');
	}

	const oauth = auth.oauth2;
	const tokenUrl = oauth.tokenUrl;

	const body = new URLSearchParams();
	body.append('grant_type', oauth.grantType);

	if (oauth.scope) {
		body.append('scope', oauth.scope);
	}

	if (oauth.grantType === 'password') {
		body.append('username', oauth.username || '');
		body.append('password', oauth.password || '');
	}

	const headers: Record<string, string> = {
		'Content-Type': 'application/x-www-form-urlencoded',
	};

	if (oauth.clientAuth === 'header') {
		const credentials = btoa(`${oauth.clientId}:${oauth.clientSecret}`);
		headers['Authorization'] = `Basic ${credentials}`;
	} else {
		body.append('client_id', oauth.clientId);
		body.append('client_secret', oauth.clientSecret);
	}

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers,
		body: body.toString(),
	});

	if (!response.ok) {
		throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();

	if (!data.access_token) {
		throw new Error('No access token received');
	}

	return data.access_token;
}
