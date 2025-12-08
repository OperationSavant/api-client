import { AuthConfig } from '@/shared/types/auth';
import { buildBasicAuthCredentials } from '@/shared/lib/auth-utils';
import { createAwsSignature } from '@/shared/lib/awsSignature';
import { RequestBody } from '@/shared/types/body';

export class AuthService {
	/**
	 * Apply authentication to request (Extension-side only)
	 */
	async applyAuthentication(
		auth: AuthConfig,
		method: string,
		url: string,
		headers: Record<string, string>,
		params: Record<string, string>,
		body?: RequestBody
	): Promise<{
		headers: Record<string, string>;
		params: Record<string, string>;
	}> {
		const newHeaders = { ...headers };
		const newParams = { ...params };

		switch (auth.type) {
			case 'basic':
				if (auth.basic) {
					const credentials = buildBasicAuthCredentials(auth.basic.username, auth.basic.password);
					const encoded = Buffer.from(credentials).toString('base64');
					newHeaders['Authorization'] = `Basic ${encoded}`;
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
					const awsHeaders = await createAwsSignature(
						method,
						url,
						newHeaders,
						auth.aws.accessKey,
						auth.aws.secretKey,
						auth.aws.sessionToken,
						auth.aws.region,
						auth.aws.service,
						body
					);
					Object.assign(newHeaders, awsHeaders);
				}
				break;
		}

		return { headers: newHeaders, params: newParams };
	}
}
