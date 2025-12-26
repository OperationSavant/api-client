import type { RequestBody} from '@/shared/types/body';
import { isFormDataBody, isRawBody, isUrlEncodedBody, isBinaryBody, isGraphQLBody, isNoneBody } from '@/shared/types/body';
import type { Param } from '@/shared/types/request';

export interface BodyAssemblyResult {
	body: RequestBody;
	contentTypeOverride?: string; // If we need to override Content-Type header
	removeContentType?: boolean; // If we need to remove Content-Type (e.g., FormData with boundary)
}

/**
 * Assembles body content for HTTP request execution
 * Uses type guards to safely access variant-specific fields
 *
 * @param body - The discriminated union body config
 * @param existingHeaders - Current headers (to check for explicit Content-Type)
 * @returns Assembly result with body config and header hints
 */
export function assembleBodyForExecution(body: RequestBody, existingHeaders: Param[]): BodyAssemblyResult {
	// Check if user explicitly set Content-Type
	const hasExplicitContentType = existingHeaders.some(h => h.checked && h.key.toLowerCase() === 'content-type' && h.value.trim() !== '');

	if (isNoneBody(body)) {
		return { body: body };
	}

	if (isRawBody(body)) {
		// Only suggest content-type if user hasn't explicitly set one
		if (!hasExplicitContentType) {
			const contentType = inferContentTypeFromLanguage(body.raw.language);
			return { body: body, contentTypeOverride: contentType };
		}
		return { body: body };
	}

	if (isFormDataBody(body)) {
		// For FormData, we need to remove explicit Content-Type
		// Let the browser/runtime set it with the boundary
		return { body: body, removeContentType: true };
	}

	if (isUrlEncodedBody(body)) {
		if (!hasExplicitContentType) {
			return { body: body, contentTypeOverride: 'application/x-www-form-urlencoded' };
		}
		return { body: body };
	}

	if (isBinaryBody(body)) {
		if (!hasExplicitContentType && body.binary.contentType) {
			return { body: body, contentTypeOverride: body.binary.contentType };
		}
		return { body: body };
	}

	if (isGraphQLBody(body)) {
		if (!hasExplicitContentType) {
			return { body: body, contentTypeOverride: 'application/json' };
		}
		return { body: body };
	}

	return { body: body };
}

/**
 * Infer Content-Type from raw body language
 */
function inferContentTypeFromLanguage(language: string | undefined): string {
	switch (language) {
		case 'json':
			return 'application/json';
		case 'xml':
			return 'application/xml';
		case 'html':
			return 'text/html';
		case 'javascript':
			return 'application/javascript';
		case 'css':
			return 'text/css';
		case 'text':
		default:
			return 'text/plain';
	}
}

/**
 * Merge content-type into headers array based on assembly result
 */
export function mergeContentTypeHeader(headers: Param[], assemblyResult: BodyAssemblyResult): Param[] {
	const newHeaders = [...headers];

	if (assemblyResult.removeContentType) {
		// Remove any Content-Type header (for FormData)
		return newHeaders.filter(h => h.key.toLowerCase() !== 'content-type');
	}

	if (assemblyResult.contentTypeOverride) {
		// Check if Content-Type already exists
		const contentTypeIndex = newHeaders.findIndex(h => h.key.toLowerCase() === 'content-type');

		if (contentTypeIndex >= 0) {
			// Only override if it's empty or unchecked
			if (!newHeaders[contentTypeIndex].checked || !newHeaders[contentTypeIndex].value.trim()) {
				newHeaders[contentTypeIndex] = {
					key: 'Content-Type',
					value: assemblyResult.contentTypeOverride,
					checked: true,
				};
			}
		} else {
			// Add new Content-Type header
			newHeaders.push({
				key: 'Content-Type',
				value: assemblyResult.contentTypeOverride,
				checked: true,
			});
		}
	}

	return newHeaders;
}
