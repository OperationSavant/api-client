import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { lookup } from 'mime-types';
import FormData from 'form-data';
import { parse as parseContentType } from 'content-type';
import { fromBuffer } from 'file-type';

// Import shared types
import type { RequestBody } from '@/shared/types/body';
import type { AuthConfig } from '@/shared/types/auth';
import type { AuthService } from './auth-service';

interface ResponseAnalysis {
	nature: 'text' | 'binary';
	format: 'json' | 'html' | 'xml' | 'text' | 'binary';
	confidence: 'high' | 'low';
	reason: string[];
}

// Define request configuration (what webview sends)
export interface RequestExecutionConfig {
	url: string;
	method: string;
	headers: Record<string, string>;
	params?: Record<string, string>;
	bodyConfig?: RequestBody;
	auth?: AuthConfig;
}

// Define result structure (what gets sent back to webview)
export interface RequestExecutionResult {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
	representations?: {
		raw: string;
		base64: string;
		hex: string;
	};
	responseTime: number;
	size: number;
	isLargeBody: boolean;
	bodyFilePath?: string;
	isError: boolean;
	error?: string;
	analysis?: ResponseAnalysis;
}

type CustomResponse = {
	body: string;
	headers: Record<string, string>;
	status: number;
	statusText: string;
	responseTime: number;
	size: number;
};

export class RequestExecutorService {
	private httpClient: AxiosInstance;
	private readonly SIZE_THRESHOLD = 5 * 1024 * 1024; // TODO: Add configurable size threshold (5MB default)

	constructor(private authService: AuthService) {
		this.httpClient = axios.create({
			timeout: 0,
			maxRedirects: 5,
			validateStatus: () => true,
			maxBodyLength: Infinity,
			maxContentLength: Infinity,
		});
	}

	/**
	 * Execute HTTP request with all body type support
	 */
	async execute(config: RequestExecutionConfig): Promise<RequestExecutionResult> {
		const startTime = Date.now();

		try {
			if (config.auth && config.auth.type !== 'none') {
				const { headers, params } = await this.authService.applyAuthentication(
					config.auth,
					config.method,
					config.url,
					config.headers,
					config.params || {},
					config.bodyConfig
				);
				config.headers = headers;
				config.params = params;
			}
			const fullUrl = this.buildUrl(config.url, config.params);

			const axiosConfig: AxiosRequestConfig = {
				method: config.method,
				url: fullUrl,
				headers: { ...config.headers },
				responseType: 'arraybuffer',
			};

			if (config.bodyConfig) {
				await this.applyRequestBody(axiosConfig, config.bodyConfig);
			}

			const response: AxiosResponse = await this.httpClient.request(axiosConfig);

			const responseTime = Date.now() - startTime;

			const result = await this.processResponse(response, responseTime);

			return result;
		} catch (error: AxiosError | any) {
			const responseData = error.response?.data;
			let size = 0;

			if (responseData !== undefined && responseData !== null) {
				const dataString = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
				size = Buffer.byteLength(dataString, 'utf8');
			}

			return {
				status: error.response?.status || 0,
				statusText: error.response?.statusText || 'Request Failed',
				headers: error.response?.headers || {},
				body: responseData || null,
				responseTime: Date.now() - startTime,
				size: size,
				isLargeBody: false,
				bodyFilePath: undefined,
				isError: true,
				error: error.message || 'Unknown error',
			};
		}
	}

	/**
	 * Build full URL with query parameters
	 */
	private buildUrl(baseUrl: string, params?: Record<string, string>): string {
		if (!params || Object.keys(params).length === 0) {
			return baseUrl;
		}
		const queryString = new URLSearchParams(params).toString();
		return queryString ? `${baseUrl}?${queryString}` : baseUrl;
	}

	/**
	 * Apply request body based on type
	 */
	private async applyRequestBody(axiosConfig: AxiosRequestConfig, body: RequestBody): Promise<void> {
		switch (body.type) {
			case 'form-data':
				await this.applyFormDataBody(axiosConfig, body.formData);
				break;

			case 'x-www-form-urlencoded':
				this.applyUrlEncodedBody(axiosConfig, body.urlEncoded);
				break;

			case 'binary':
				await this.applyBinaryBody(axiosConfig, body.binary);
				break;

			case 'raw':
				this.applyRawBody(axiosConfig, body.raw);
				break;

			case 'graphql': {
				this.applyGraphQLBody(axiosConfig, body.graphql);
				break;
			}

			case 'none':
			default:
				break;
		}
	}

	/**
	 * Handle GraphQL body
	 */
	private applyGraphQLBody(axiosConfig: AxiosRequestConfig, graphql: any): void {
		if (!axiosConfig.headers) axiosConfig.headers = {};
		const payload = {
			query: graphql.query || '',
			variables: graphql.variables ? JSON.parse(graphql.variables) : undefined,
			...(graphql.operationName && { operationName: graphql.operationName }),
		};
		axiosConfig.data = JSON.stringify(payload);
		axiosConfig.headers['Content-Type'] = 'application/json';
	}

	/**
	 * Handle multipart/form-data with files
	 */
	private async applyFormDataBody(axiosConfig: AxiosRequestConfig, formData: any[]): Promise<void> {
		const form = new FormData();

		for (const field of formData) {
			if (!field.checked || !field.key) continue;

			if (field.type === 'text') {
				form.append(field.key, field.value);
			} else if (field.type === 'file' && field.value) {
				const filePath = field.value;
				const contentType = lookup(filePath) || 'application/octet-stream';
				const stream = fs.createReadStream(filePath);
				const fileName = field.fileName || path.basename(filePath);

				form.append(field.key, stream, {
					filename: fileName,
					contentType: contentType,
				});
			}
		}

		axiosConfig.data = form;
		axiosConfig.headers = {
			...axiosConfig.headers,
			...form.getHeaders(),
		};
	}

	/**
	 * Handle application/x-www-form-urlencoded
	 */
	private applyUrlEncodedBody(axiosConfig: AxiosRequestConfig, urlEncoded: any[]): void {
		const params = new URLSearchParams();

		for (const field of urlEncoded) {
			if (field.checked && field.key) {
				params.append(field.key, field.value);
			}
		}
		if (!axiosConfig.headers) {
			axiosConfig.headers = {};
		}

		axiosConfig.data = params.toString();
		axiosConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded';
	}

	/**
	 * Handle binary file upload
	 */
	private async applyBinaryBody(axiosConfig: AxiosRequestConfig, binary: any): Promise<void> {
		const filePath = binary.filePath;
		const stats = fs.statSync(filePath);
		const stream = fs.createReadStream(filePath);

		if (!axiosConfig.headers) {
			axiosConfig.headers = {};
		}
		axiosConfig.data = stream;
		axiosConfig.headers['Content-Length'] = stats.size.toString();

		if (!axiosConfig.headers['Content-Type']) {
			axiosConfig.headers['Content-Type'] = binary.contentType || 'application/octet-stream';
		}
	}

	/**
	 * Handle raw body (JSON, XML, text, etc.)
	 */
	private applyRawBody(axiosConfig: AxiosRequestConfig, raw: any): void {
		if (!axiosConfig.headers) {
			axiosConfig.headers = {};
		}
		axiosConfig.data = raw.content;

		if (!axiosConfig.headers['Content-Type']) {
			switch (raw.language) {
				case 'json':
					axiosConfig.headers['Content-Type'] = 'application/json';
					break;
				case 'xml':
					axiosConfig.headers['Content-Type'] = 'application/xml';
					break;
				case 'html':
					axiosConfig.headers['Content-Type'] = 'text/html';
					break;
				case 'javascript':
					axiosConfig.headers['Content-Type'] = 'application/javascript';
					break;
				case 'css':
					axiosConfig.headers['Content-Type'] = 'text/css';
					break;
				default:
					axiosConfig.headers['Content-Type'] = 'text/plain';
			}
		}
	}

	/**
	 * Process response and handle large bodies
	 */
	// private async processResponse(response: AxiosResponse, responseTime: number): Promise<RequestExecutionResult> {
	// 	const { data, headers, status, statusText } = response;

	// 	const { type: contentType, parameters } = parseContentType(headers['content-type'] || '') || '';
	// 	const size = data.length;
	// 	let body: string = '';

	// 	try {
	// 		if (contentType.includes('json') || contentType.includes('text/') || contentType.includes('xml') || contentType.includes('javascript')) {
	// 			body = data.toString('utf-8');
	// 			body = new TextDecoder(parameters?.charset || 'utf-8', { fatal: false }).decode(data);
	// 		} else {
	// 			body = `data:${contentType};base64,${data.toString('base64')}`;
	// 		}
	// 		const customResponse: CustomResponse = {
	// 			body,
	// 			headers: headers as Record<string, string>,
	// 			status,
	// 			statusText,
	// 			responseTime,
	// 			size,
	// 		};
	// 		return this.handleResponse(customResponse);
	// 	} catch (error) {
	// 		throw new Error('Failed to process response content');
	// 	}
	// }
	private async processResponse(response: AxiosResponse, responseTime: number): Promise<RequestExecutionResult> {
		const { data, headers, status, statusText } = response;
		const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
		const size = buffer.length;

		// ---- weak content-type parsing (only for mime + charset hints) ----
		let contentType = '';
		let charset = 'utf-8';

		try {
			const ctHeader = headers['content-type'];
			if (ctHeader) {
				const parsed = parseContentType(ctHeader);
				contentType = parsed.type;
				charset = parsed.parameters?.charset || charset;
			}
		} catch {
			// ignore malformed content-type
		}

		// ---- authoritative analysis (no decoding yet) ----
		const analysis = await analyzeResponse(data, contentType, charset);

		let body: string;

		if (analysis.nature === 'binary') {
			// binary must be sent as data URI (renderer contract)
			const mime = analysis.confidence === 'high' && contentType ? contentType : 'application/octet-stream';

			body = `data:${mime};base64,${buffer.toString('base64')}`;
		} else {
			// text-safe → decode using resolved charset
			body = buffer.toString(normalizeToBufferEncoding(charset) ?? 'utf-8');
		}

		const representations = buildRepresentations(buffer, charset);

		return {
			status,
			statusText,
			headers: headers as Record<string, string>,
			body,
			representations,
			responseTime,
			size,
			isLargeBody: false,
			bodyFilePath: undefined,
			isError: !this.isSuccessStatus(status),
			error: !this.isSuccessStatus(status) ? statusText : undefined,
			analysis,
		};
	}

	/**
	 * Handle normal response bodies (parse content)
	 */
	private handleResponse(customResponse: CustomResponse): RequestExecutionResult {
		const { status, statusText } = customResponse;
		const isError = !this.isSuccessStatus(status);
		return {
			...customResponse,
			isLargeBody: false,
			bodyFilePath: undefined,
			isError,
			error: isError ? statusText : undefined,
		};
	}

	/**
	 * Handle large response bodies (write to temp file)
	 */
	// private async handleLargeResponse(response: AxiosResponse, bodyBuffer: Buffer, responseTime: number, size: number): Promise<RequestExecutionResult> {
	// 	if (!fs.existsSync(this.storageUri.fsPath)) {
	// 		fs.mkdirSync(this.storageUri.fsPath, { recursive: true });
	// 	}

	// 	const tempFileName = `response-${Date.now()}.tmp`;
	// 	const tempFileUri = Uri.joinPath(this.storageUri, tempFileName);

	// 	fs.writeFileSync(tempFileUri.fsPath, bodyBuffer);

	// 	return {
	// 		status: response.status,
	// 		statusText: response.statusText,
	// 		headers: response.headers as Record<string, string>,
	// 		body: null,
	// 		responseTime,
	// 		size,
	// 		isLargeBody: true,
	// 		bodyFilePath: tempFileUri.toString(),
	// 		isError: !this.isSuccessStatus(response.status),
	// 		error: !this.isSuccessStatus(response.status) ? `HTTP ${response.status} ${response.statusText}` : undefined,
	// 	};
	// }

	/**
	 * Check if status code is success (2xx)
	 */
	private isSuccessStatus(status: number): boolean {
		return status >= 200 && status < 300;
	}

	private getContentLength = (headers: Record<string, string>, body: string): number => {
		const contentLengthHeader = headers['content-length'] || headers['Content-Length'] || 0;
		return contentLengthHeader ? parseInt(contentLengthHeader, 10) : Buffer.byteLength(body, 'utf8');
	};
}

export async function analyzeResponse(buffer: ArrayBuffer, contentTypeHeader?: string, charset: string = 'utf-8'): Promise<ResponseAnalysis> {
	const reasons: string[] = [];

	// ------------------------------------------------------------
	// 1. Known binary detection (authoritative, high confidence)
	// ------------------------------------------------------------
	const fileType = await fromBuffer(buffer);
	if (fileType) {
		return {
			nature: 'binary',
			format: 'binary',
			confidence: 'high',
			reason: [`file-type detected (${fileType.mime})`],
		};
	}

	// ------------------------------------------------------------
	// 2. Text-safety check (hard gate)
	// ------------------------------------------------------------
	if (!isTextSafe(buffer)) {
		return {
			nature: 'binary',
			format: 'binary',
			confidence: 'low',
			reason: ['payload is not safely decodable as text'],
		};
	}

	// ------------------------------------------------------------
	// 3. Decode small head only (safe now)
	// ------------------------------------------------------------
	const head = decodeHead(buffer, charset);

	// ------------------------------------------------------------
	// 4. HTML detection (highest priority for text)
	// ------------------------------------------------------------
	if (looksLikeHtml(head)) {
		return {
			nature: 'text',
			format: 'html',
			confidence: 'high',
			reason: ['html structural markers detected'],
		};
	}

	// ------------------------------------------------------------
	// 5. JSON detection (shape + parse)
	// ------------------------------------------------------------
	if (looksLikeJson(head) && parsesAsJson(buffer, charset)) {
		return {
			nature: 'text',
			format: 'json',
			confidence: 'high',
			reason: ['json shape + successful parse'],
		};
	}

	// ------------------------------------------------------------
	// 6. XML detection (namespace-agnostic, html-biased)
	// ------------------------------------------------------------
	if (looksLikeXml(head)) {
		return {
			nature: 'text',
			format: 'xml',
			confidence: 'high',
			reason: ['xml structural markers detected'],
		};
	}

	// ------------------------------------------------------------
	// 7. Weak header signal (confidence booster only)
	// ------------------------------------------------------------
	if (contentTypeHeader) {
		const ct = contentTypeHeader.toLowerCase();
		if (ct.includes('json')) reasons.push('content-type hints json');
		if (ct.includes('xml')) reasons.push('content-type hints xml');
		if (ct.includes('html')) reasons.push('content-type hints html');
	}

	// ------------------------------------------------------------
	// 8. Text fallback (explicit, low confidence)
	// ------------------------------------------------------------
	return {
		nature: 'text',
		format: 'text',
		confidence: 'low',
		reason: reasons.length ? reasons : ['no dominant format detected'],
	};
}

/* ============================================================
   Helpers
   ============================================================ */

function isTextSafe(buffer: ArrayBuffer): boolean {
	const view = new Uint8Array(buffer);
	const len = Math.min(view.length, 512);
	let control = 0;

	for (let i = 0; i < len; i++) {
		const b = view[i];
		if (b === 0) return false;
		if (b < 9 || (b > 13 && b < 32)) control++;
	}

	return control / len < 0.1;
}

function decodeHead(buffer: ArrayBuffer, charset: string): string {
	return new TextDecoder(charset || 'utf-8', { fatal: false }).decode(buffer.slice(0, 1024)).trim();
}

function looksLikeHtml(head: string): boolean {
	return /^<!doctype html/i.test(head) || /^<html[\s>]/i.test(head) || /<(head|body|script|meta|link|style)\b/i.test(head);
}

function looksLikeJson(head: string): boolean {
	return head.startsWith('{') || head.startsWith('[');
}

function parsesAsJson(buffer: ArrayBuffer, charset: string): boolean {
	try {
		const text = new TextDecoder(charset || 'utf-8').decode(buffer);
		JSON.parse(text);
		return true;
	} catch {
		return false;
	}
}

function looksLikeXml(head: string): boolean {
	if (head.startsWith('<?xml')) return true;

	return /^<[\w:-]+>/.test(head) && !/<(html|head|body|script|meta|style)\b/i.test(head);
}

function buildRepresentations(data: Buffer, charset: string) {
	return {
		raw: data.toString(normalizeToBufferEncoding(charset) ?? 'utf-8'),
		base64: data.toString('base64'),
		hex: data.toString('hex'),
	};
}

function normalizeToBufferEncoding(charset?: string): BufferEncoding {
	if (!charset) return 'utf8';

	switch (charset.toLowerCase()) {
		case 'utf-8':
		case 'utf8':
			return 'utf8';

		case 'latin1':
		case 'iso-8859-1':
			return 'latin1';

		case 'ascii':
			return 'ascii';

		case 'ucs-2':
		case 'ucs2':
		case 'utf-16le':
			return 'utf16le';

		default:
			return 'utf8';
	}
}
