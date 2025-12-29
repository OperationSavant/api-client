import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { lookup } from 'mime-types';
import FormData from 'form-data';
import { parse as parseContentType } from 'content-type';
import { fromBuffer } from 'file-type';
import type { BinaryBody, FormDataBody, GraphQLBody, UrlEncodedBody, RawBody, RequestBody } from '@/shared/types/body';
import type { AuthService } from './auth-service';
import type { HexRow, HexViewModel, Response, ResponseAnalysis } from '@/shared/types/response';
import type { Request } from '@/shared/types/request';

/**
 * SIZE_THRESHOLD defines the maximum response payload size (in bytes) for which
 * the system will:
 *  - render the response inline in the viewer
 *  - attempt expensive analysis operations (e.g. full JSON.parse for confidence boosting)
 *
 * Responses larger than this threshold are treated conservatively:
 *  - rendered via download / external handling
 *  - analyzed using structural heuristics only
 *
 * This is a deliberate product and performance policy, not an implementation detail.
 */
const SIZE_THRESHOLD = 5 * 1024 * 1024; // TODO: Add configurable size threshold (5MB default)
export class RequestExecutorService {
	private httpClient: AxiosInstance;

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
	async execute(config: Request): Promise<Response> {
		const startTime = Date.now();

		try {
			if (config.auth && config.auth.type !== 'none') {
				const { headers, params } = await this.authService.applyAuthentication(
					config.auth,
					config.method,
					config.url,
					config.headers,
					config.params || {},
					config.body
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

			if (config.body) {
				await this.applyRequestBody(axiosConfig, config.body);
			}

			const response: AxiosResponse = await this.httpClient.request(axiosConfig);

			const duration = Date.now() - startTime;

			const result = await this.processResponse(response, duration);

			return result;
		} catch (error: unknown) {
			const duration = Date.now() - startTime;
			const axiosError = error as AxiosError;
			const responseData = axiosError.response?.data;
			let size = 0;
			let dataString = '';
			if (responseData !== undefined && responseData !== null) {
				dataString = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
				size = Buffer.byteLength(dataString, 'utf8');
			}
			return {
				status: axiosError.response?.status || 0,
				statusText: axiosError.response?.statusText || 'Request Failed',
				headers: (axiosError.response?.headers as Record<string, string>) || {},
				body: dataString,
				contentType: axiosError.response?.headers
					? (axiosError.response?.headers['content-type'] as string) || (axiosError.response?.headers['Content-Type'] as string)
					: 'text/plain',
				size,
				duration,
				isError: true,
				error: axiosError.message || 'Unknown error',
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
	private applyGraphQLBody(axiosConfig: AxiosRequestConfig, graphql: GraphQLBody): void {
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
	private async applyFormDataBody(axiosConfig: AxiosRequestConfig, formData: FormDataBody[]): Promise<void> {
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
	private applyUrlEncodedBody(axiosConfig: AxiosRequestConfig, urlEncoded: UrlEncodedBody[]): void {
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
	private async applyBinaryBody(axiosConfig: AxiosRequestConfig, binary: BinaryBody): Promise<void> {
		const filePath = binary.filePath;
		if (filePath === undefined) {
			throw new Error('Binary body requires a valid file path.');
		}
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
	private applyRawBody(axiosConfig: AxiosRequestConfig, raw: RawBody): void {
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
	private async processResponse(response: AxiosResponse, duration: number): Promise<Response> {
		const { data, headers, status, statusText } = response;
		const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data?.buffer, data?.byteOffset, data?.byteLength);
		const size = buffer.length;
		let contentType = '';
		let charset = 'utf-8';

		try {
			const ctHeader = headers['content-type'];
			if (ctHeader) {
				const parsed = parseContentType(ctHeader);
				contentType = parsed.type;
				charset = parsed.parameters?.charset || charset;
			}
		} catch {}
		const analysis = await this.analyzeResponse(buffer, contentType, charset);

		let body: string;

		if (analysis.nature === 'binary') {
			const mime = analysis.confidence === 'high' && contentType ? contentType : 'application/octet-stream';

			body = `data:${mime};base64,${buffer.toString('base64')}`;
		} else {
			try {
				body = new TextDecoder(charset || 'utf-8', { fatal: false }).decode(buffer);
			} catch {
				body = new TextDecoder('utf-8').decode(buffer);
			}
		}
		const representations = this.buildRepresentations(buffer);
		return {
			status,
			statusText,
			headers: headers as Record<string, string>,
			body,
			representations,
			contentType,
			size,
			duration,
			analysis,
		};
	}

	/**
	 * Check if status code is success (2xx)
	 */
	private isSuccessStatus(status: number): boolean {
		return status >= 200 && status < 300;
	}

	/**
	 * Analyzes response data with confidence
	 * content type is only used for weak hints
	 * @param {Buffer} buffer
	 * @param {string} [contentTypeHeader]
	 * @param {string} [charset='utf-8']
	 * @return {*}  {Promise<ResponseAnalysis>}
	 */
	private async analyzeResponse(buffer: Buffer, contentTypeHeader?: string, charset: string = 'utf-8'): Promise<ResponseAnalysis> {
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
		if (!this.isTextSafe(buffer)) {
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
		const head = this.decodeHead(buffer, charset);

		// ------------------------------------------------------------
		// 4. HTML detection (highest priority for text)
		// ------------------------------------------------------------
		if (this.looksLikeHtml(head)) {
			return {
				nature: 'text',
				format: 'html',
				confidence: 'high',
				reason: ['html structural markers detected', ...this.getHeaderHints(contentTypeHeader || '')],
			};
		}

		// ------------------------------------------------------------
		// 5. JSON detection (shape + parse)
		// ------------------------------------------------------------
		if (this.looksLikeJson(head)) {
			const parsed = this.parsesAsJson(buffer, charset);

			return {
				nature: 'text',
				format: 'json',
				confidence: parsed ? 'high' : 'low',
				reason: parsed
					? ['json shape + successful parse', ...this.getHeaderHints(contentTypeHeader || '')]
					: ['json structural markers detected', ...this.getHeaderHints(contentTypeHeader || '')],
			};
		}

		// ------------------------------------------------------------
		// 6. XML detection (namespace-agnostic, html-biased)
		// ------------------------------------------------------------
		if (this.looksLikeXml(head)) {
			return {
				nature: 'text',
				format: 'xml',
				confidence: 'high',
				reason: ['xml structural markers detected', ...this.getHeaderHints(contentTypeHeader || '')],
			};
		}

		// ------------------------------------------------------------
		// 8. Text fallback (explicit, low confidence)
		// ------------------------------------------------------------
		return {
			nature: 'text',
			format: 'text',
			confidence: 'low',
			reason: this.getHeaderHints(contentTypeHeader || '').length ? this.getHeaderHints(contentTypeHeader || '') : ['no dominant format detected'],
		};
	}

	/* ============================================================
   Helpers
   ============================================================ */

	private getHeaderHints(contentTypeHeader: string): string[] {
		const reasons: string[] = [];
		const ct = contentTypeHeader.toLowerCase();
		if (ct.includes('json')) reasons.push('content-type hints json');
		if (ct.includes('xml')) reasons.push('content-type hints xml');
		if (ct.includes('html')) reasons.push('content-type hints html');
		return reasons;
	}

	private isTextSafe(buffer: Buffer): boolean {
		const len = Math.min(buffer.length, 512);
		let control = 0;

		for (let i = 0; i < len; i++) {
			const b = buffer[i];
			if (b === 0) return false;
			if (b < 9 || (b > 13 && b < 32)) control++;
		}

		return control / len < 0.1;
	}

	private decodeHead(buffer: Buffer, charset: string): string {
		return new TextDecoder(charset || 'utf-8', { fatal: false }).decode(buffer.slice(0, 1024)).trim();
	}

	private looksLikeHtml(head: string): boolean {
		return /^<!doctype html/i.test(head) || /^<html[\s>]/i.test(head) || /<(head|body|script|meta|link|style)\b/i.test(head);
	}

	private looksLikeJson(head: string): boolean {
		return head.startsWith('{') || head.startsWith('[');
	}

	/**
	 * Only attempt full parse on reasonably-sized payloads
	 * For large payloads, rely on shape-based detection only
	 * @private
	 * @param {Buffer} buffer
	 * @param {string} charset
	 * @return {*}  {boolean}
	 * @memberof RequestExecutorService
	 */
	private parsesAsJson(buffer: Buffer, charset: string): boolean {
		try {
			if (buffer.byteLength > SIZE_THRESHOLD) {
				return false;
			}
			JSON.parse(new TextDecoder(charset || 'utf-8').decode(buffer));
			return true;
		} catch {
			return false;
		}
	}

	private looksLikeXml(head: string): boolean {
		if (head.startsWith('<?xml')) return true;

		return /^<[\w:-]+>/.test(head) && !/<(html|head|body|script|meta|style)\b/i.test(head);
	}

	private buildRepresentations(data: Buffer) {
		return {
			raw: data.toString('latin1'),
			base64: data.toString('base64'),
			hex: this.buildHexViewModel(data),
		};
	}

	private buildHexViewModel(buffer: Buffer, bytesPerRow = 16): HexViewModel {
		const rows: HexRow[] = [];

		for (let offset = 0; offset < buffer.length; offset += bytesPerRow) {
			const slice = buffer.subarray(offset, offset + bytesPerRow);

			const hex: string[] = [];
			let ascii = '';

			for (const byte of slice) {
				hex.push(byte.toString(16).padStart(2, '0'));

				ascii += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
			}

			rows.push({
				offset,
				hex,
				ascii,
			});
		}

		return { bytesPerRow, rows };
	}
}
