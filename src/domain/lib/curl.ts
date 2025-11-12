// cURL Integration utilities for VS Code API Client
// Handles parsing cURL commands to requests and generating cURL from requests

import { RequestBodyConfig } from '@/shared/types/body';

export interface CurlParseResult {
	url: string;
	method: string;
	headers: Record<string, string>;
	body?: RequestBodyConfig;
	auth?: {
		type: 'basic' | 'bearer' | 'api-key';
		credentials: Record<string, string>;
	};
	success: boolean;
	errors: string[];
}

export interface CurlGenerateOptions {
	url: string;
	method: string;
	headers?: Record<string, string>;
	body?: RequestBodyConfig;
	auth?: {
		type: 'basic' | 'bearer' | 'api-key';
		credentials: Record<string, string>;
	};
	includeHeaders?: boolean;
	compressed?: boolean;
	followRedirects?: boolean;
	insecure?: boolean;
}

/**
 * Parses a cURL command string into a structured request format
 */
export function parseCurlCommand(curlCommand: string): CurlParseResult {
	const result: CurlParseResult = {
		url: '',
		method: 'GET',
		headers: {},
		success: false,
		errors: [],
	};

	try {
		// Basic validation
		if (!curlCommand.trim()) {
			result.errors.push('cURL command cannot be empty');
			return result;
		}

		const trimmed = curlCommand.trim();
		if (!trimmed.toLowerCase().startsWith('curl ')) {
			result.errors.push('Command must start with "curl "');
			return result;
		}

		// Clean up the command - remove line breaks and extra spaces
		const cleaned = trimmed
			.replace(/\\\r?\n/g, ' ') // Handle line continuations
			.replace(/\s+/g, ' ') // Normalize whitespace
			.trim();

		// Parse using a simple argument parser
		const args = parseArguments(cleaned);

		// Extract URL (usually the last argument or after specific flags)
		const url = extractUrl(args);
		if (!url) {
			result.errors.push('No valid URL found in cURL command');
			return result;
		}
		result.url = url;

		// Extract HTTP method
		result.method = extractMethod(args);

		// Extract headers
		result.headers = extractHeaders(args);

		// Extract authentication
		const auth = extractAuth(args, result.headers);
		if (auth) {
			result.auth = auth;
		}

		// Extract body data
		const body = extractBody(args, result.headers);
		if (body) {
			result.body = body;
		}

		result.success = true;
		return result;
	} catch (error) {
		result.errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		return result;
	}
}

/**
 * Generates a cURL command from request configuration
 */
export function generateCurlCommand(options: CurlGenerateOptions): string {
	const parts: string[] = ['curl'];

	// Add method if not GET
	if (options.method && options.method.toUpperCase() !== 'GET') {
		parts.push('-X', options.method.toUpperCase());
	}

	// Add headers
	if (options.headers) {
		Object.entries(options.headers).forEach(([key, value]) => {
			parts.push('-H', `"${key}: ${value}"`);
		});
	}

	// Add authentication
	if (options.auth) {
		switch (options.auth.type) {
			case 'basic':
				if (options.auth.credentials.username && options.auth.credentials.password) {
					parts.push('-u', `"${options.auth.credentials.username}:${options.auth.credentials.password}"`);
				}
				break;
			case 'bearer':
				if (options.auth.credentials.token) {
					const prefix = options.auth.credentials.prefix || 'Bearer';
					parts.push('-H', `"Authorization: ${prefix} ${options.auth.credentials.token}"`);
				}
				break;
			case 'api-key':
				if (options.auth.credentials.key && options.auth.credentials.value) {
					parts.push('-H', `"${options.auth.credentials.key}: ${options.auth.credentials.value}"`);
				}
				break;
		}
	}

	// Add body data
	if (options.body && options.body.type !== 'none') {
		const bodyData = generateBodyData(options.body);
		if (bodyData) {
			parts.push('-d', bodyData);
		}
	}

	// Add common options
	if (options.compressed) {
		parts.push('--compressed');
	}

	if (options.followRedirects) {
		parts.push('-L');
	}

	if (options.insecure) {
		parts.push('-k');
	}

	if (options.includeHeaders) {
		parts.push('-i');
	}

	// Add URL (always last)
	parts.push(`"${options.url}"`);

	return parts.join(' ');
}

/**
 * Simple argument parser for cURL commands
 */
function parseArguments(command: string): string[] {
	const args: string[] = [];
	let current = '';
	let inQuotes = false;
	let quoteChar = '';
	let escaped = false;

	for (let i = 0; i < command.length; i++) {
		const char = command[i];

		if (escaped) {
			current += char;
			escaped = false;
			continue;
		}

		if (char === '\\') {
			escaped = true;
			continue;
		}

		if (!inQuotes && (char === '"' || char === "'")) {
			inQuotes = true;
			quoteChar = char;
			continue;
		}

		if (inQuotes && char === quoteChar) {
			inQuotes = false;
			quoteChar = '';
			continue;
		}

		if (!inQuotes && char === ' ') {
			if (current.trim()) {
				args.push(current.trim());
				current = '';
			}
			continue;
		}

		current += char;
	}

	if (current.trim()) {
		args.push(current.trim());
	}

	return args;
}

/**
 * Extract URL from parsed arguments
 */
function extractUrl(args: string[]): string | null {
	// Look for URL patterns
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		// Skip flags and their values
		if (arg.startsWith('-')) {
			// Skip the next argument if this flag takes a value
			if (['-X', '-H', '-d', '-u', '--data', '--header', '--request', '--user'].includes(arg)) {
				i++; // Skip next argument
			}
			continue;
		}

		// Check if this looks like a URL
		if (isValidUrl(arg)) {
			return arg;
		}
	}

	return null;
}

/**
 * Extract HTTP method from arguments
 */
function extractMethod(args: string[]): string {
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '-X' || args[i] === '--request') {
			if (i + 1 < args.length) {
				return args[i + 1].toUpperCase();
			}
		}
	}
	return 'GET';
}

/**
 * Extract headers from arguments
 */
function extractHeaders(args: string[]): Record<string, string> {
	const headers: Record<string, string> = {};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '-H' || args[i] === '--header') {
			if (i + 1 < args.length) {
				const headerStr = args[i + 1];
				const colonIndex = headerStr.indexOf(':');
				if (colonIndex > 0) {
					const key = headerStr.substring(0, colonIndex).trim();
					const value = headerStr.substring(colonIndex + 1).trim();
					headers[key] = value;
				}
			}
		}
	}

	return headers;
}

/**
 * Extract authentication from arguments and headers
 */
function extractAuth(args: string[], headers: Record<string, string>): CurlParseResult['auth'] | null {
	// Check for basic auth
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '-u' || args[i] === '--user') {
			if (i + 1 < args.length) {
				const userPass = args[i + 1];
				const colonIndex = userPass.indexOf(':');
				if (colonIndex > 0) {
					return {
						type: 'basic',
						credentials: {
							username: userPass.substring(0, colonIndex),
							password: userPass.substring(colonIndex + 1),
						},
					};
				}
			}
		}
	}

	// Check for bearer token in Authorization header (case-insensitive)
	const authHeader =
		headers['Authorization'] || headers['authorization'] || Object.entries(headers).find(([key]) => key.toLowerCase() === 'authorization')?.[1];

	if (authHeader) {
		const bearerMatch = authHeader.match(/^(Bearer|bearer|Token|token)\s+(.+)$/);
		if (bearerMatch) {
			return {
				type: 'bearer',
				credentials: {
					token: bearerMatch[2],
					prefix: bearerMatch[1],
				},
			};
		}
	}

	return null;
}

/**
 * Extract body data from arguments
 */
function extractBody(args: string[], headers: Record<string, string>): RequestBodyConfig | null {
	let bodyData: string | null = null;

	// Find data arguments
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '-d' || args[i] === '--data' || args[i] === '--data-raw') {
			if (i + 1 < args.length) {
				bodyData = args[i + 1];
				break;
			}
		}
	}

	if (!bodyData) {
		return null;
	}

	// Determine body type from Content-Type header
	const contentType = headers['Content-Type'] || headers['content-type'] || '';

	if (contentType.includes('application/json')) {
		return {
			type: 'raw',
			formData: [],
			urlEncoded: [],
			raw: {
				content: bodyData,
				language: 'json',
				autoFormat: true,
			},
			binary: {},
			graphql: { query: '', variables: '' },
		};
	}

	if (contentType.includes('application/x-www-form-urlencoded')) {
		return {
			type: 'x-www-form-urlencoded',
			formData: [],
			urlEncoded: parseUrlEncodedData(bodyData),
			raw: { content: '', language: 'text', autoFormat: false },
			binary: {},
			graphql: { query: '', variables: '' },
		};
	}

	if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
		return {
			type: 'raw',
			formData: [],
			urlEncoded: [],
			raw: {
				content: bodyData,
				language: 'xml',
				autoFormat: true,
			},
			binary: {},
			graphql: { query: '', variables: '' },
		};
	}

	// Default to raw text
	return {
		type: 'raw',
		formData: [],
		urlEncoded: [],
		raw: {
			content: bodyData,
			language: 'text',
			autoFormat: false,
		},
		binary: {},
		graphql: { query: '', variables: '' },
	};
}

/**
 * Parse URL-encoded data into key-value pairs
 */
function parseUrlEncodedData(data: string): Array<{ key: string; value: string; checked: boolean }> {
	const pairs: Array<{ key: string; value: string; checked: boolean }> = [];

	const params = new URLSearchParams(data);
	for (const [key, value] of params.entries()) {
		pairs.push({
			key: decodeURIComponent(key),
			value: decodeURIComponent(value),
			checked: true,
		});
	}

	return pairs;
}

/**
 * Generate body data string for cURL command
 */
function generateBodyData(body: RequestBodyConfig): string | null {
	switch (body.type) {
		case 'raw': {
			return `"${body.raw.content!.replace(/"/g, '\\"')}"`;
		}

		case 'x-www-form-urlencoded': {
			const urlEncodedPairs = body.urlEncoded
				.filter(pair => pair.checked)
				.map(pair => `${encodeURIComponent(pair.key)}=${encodeURIComponent(pair.value)}`)
				.join('&');
			return urlEncodedPairs ? `"${urlEncodedPairs}"` : null;
		}

		case 'form-data': {
			// For form-data, we'd need to use --form instead of -d
			// This is a simplified version
			const formPairs = body.formData
				.filter(field => field.checked && field.type === 'text')
				.map(field => `${field.key}=${field.value}`)
				.join('&');
			return formPairs ? `"${formPairs}"` : null;
		}

		case 'graphql': {
			const graphqlPayload = {
				query: body.graphql.query,
				variables: body.graphql.variables ? JSON.parse(body.graphql.variables) : {},
				operationName: body.graphql.operationName,
			};
			return `"${JSON.stringify(graphqlPayload).replace(/"/g, '\\"')}"`;
		}

		default:
			return null;
	}
}

/**
 * Simple URL validation
 */
function isValidUrl(string: string): boolean {
	try {
		const url = new URL(string);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		// Check for relative URLs or URLs without protocol
		return (
			/^(https?:\/\/)?[\w.-]+\.[\w.-]+(\/.*)?$/.test(string) ||
			/^(https?:\/\/)?localhost(:\d+)?(\/.*)?$/.test(string) ||
			/^(https?:\/\/)?(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/.test(string)
		);
	}
}

/**
 * Validates a cURL command for basic syntax
 */
export function validateCurlCommand(curlCommand: string): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!curlCommand.trim()) {
		errors.push('cURL command cannot be empty');
	}

	if (!curlCommand.trim().toLowerCase().startsWith('curl ')) {
		errors.push('Command must start with "curl "');
	}

	// Check for unmatched quotes
	const singleQuotes = (curlCommand.match(/'/g) || []).length;
	const doubleQuotes = (curlCommand.match(/"/g) || []).length;

	if (singleQuotes % 2 !== 0) {
		errors.push('Unmatched single quotes in command');
	}

	if (doubleQuotes % 2 !== 0) {
		errors.push('Unmatched double quotes in command');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
