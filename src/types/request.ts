// Types for HTTP requests and cURL integration

import { AuthConfig } from './auth';
import { RequestBodyConfig } from './body';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RequestOptions {
	followRedirects?: boolean;
	maxRedirects?: number;
	timeout?: number;
	compressed?: boolean;
	insecure?: boolean;
	includeHeaders?: boolean;
	userAgent?: string;
	cookies?: string;
}

export interface RequestConfig {
	url: string;
	method: HttpMethod;
	headers: Record<string, string>;
	auth: AuthConfig;
	body: RequestBodyConfig;
	options?: RequestOptions;
}

export interface CurlParseResult {
	url: string;
	method: HttpMethod;
	headers: Record<string, string>;
	auth: AuthConfig;
	body: RequestBodyConfig;
	success: boolean;
	errors: string[];
}

// Default request configuration
export const createDefaultRequest = (): RequestConfig => ({
	url: '',
	method: 'GET',
	headers: {},
	auth: { type: 'none' },
	body: {
		type: 'none',
		formData: [],
		urlEncoded: [],
		raw: {
			content: '',
			language: 'json',
			autoFormat: true,
		},
		binary: {},
		graphql: {
			query: '',
			variables: '',
		},
	},
	options: {
		followRedirects: true,
		maxRedirects: 5,
		timeout: 30000,
		compressed: false,
		insecure: false,
		includeHeaders: false,
	},
});
