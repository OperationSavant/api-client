// Types for HTTP requests and cURL integration

import { HttpVerb } from '.';
import { AuthConfig } from './auth';
import { createDefaultRequestBody, RequestBody } from './body';

export type Param = { key: string; value: string; checked: boolean };

export interface KeyValueEntry {
	key: string;
	value: string;
	checked: boolean;
}

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

export interface Request {
	url: string;
	method: HttpVerb;
	params: Record<string, string>;
	headers: Record<string, string>;
	auth: AuthConfig;
	body: RequestBody;
	options?: RequestOptions;
}

export interface CurlParseResult {
	url: string;
	method: HttpVerb;
	headers: Record<string, string>;
	auth: AuthConfig;
	body: RequestBody;
	success: boolean;
	errors: string[];
}

export const createDefaultRequest = (): Request => ({
	url: 'https://jsonplaceholder.typicode.com/posts',
	method: 'GET',
	params: {},
	headers: {},
	auth: { type: 'none' },
	body: createDefaultRequestBody(),
	options: {
		followRedirects: true,
		maxRedirects: 5,
		timeout: 30000,
		compressed: false,
		insecure: false,
		includeHeaders: false,
		userAgent: '',
		cookies: '',
	},
});
