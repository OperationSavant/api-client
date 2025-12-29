import type { HttpVerb } from '.';
import type { AuthConfig } from './auth';
import type { RequestBody } from './body';
import { createDefaultRequestBody } from './body';

export type Param = { key: string; value: string; checked: boolean };

export interface Request {
	url: string;
	method: HttpVerb;
	params: Record<string, string>;
	headers: Record<string, string>;
	auth: AuthConfig;
	body: RequestBody;
	options?: RequestOptions;
}

interface RequestOptions {
	followRedirects?: boolean;
	maxRedirects?: number;
	timeout?: number;
	compressed?: boolean;
	insecure?: boolean;
	includeHeaders?: boolean;
	userAgent?: string;
	cookies?: string;
}

//TODO: Remove from here and move it to some utils/helpers file
export const createDefaultRequest = (): Request => ({
	url: '',
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
