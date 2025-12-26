/**
 * Cookie Integration
 * Integration component for automatic cookie handling in HTTP requests
 */

import type { CookieService } from '@/domain/services/cookie-service';
import type { Request } from '@/shared/types/request';

export interface HttpResponse {
	status: number;
	statusText: string;
	headers: Record<string, string | string[]>;
	data: any;
	responseTime?: number;
}

export class CookieIntegration {
	private cookieService: CookieService;

	constructor(cookieService: CookieService) {
		this.cookieService = cookieService;
	}

	/**
	 * Process outgoing request to add relevant cookies
	 */
	processRequest(request: Request): Request {
		const cookies = this.cookieService.getCookiesForRequest(request.url);

		if (cookies.length > 0) {
			const cookieHeader = this.cookieService.getCookieHeader(request.url);

			// Add Cookie header to request
			request.headers = {
				...request.headers,
				Cookie: cookieHeader,
			};
		}

		return request;
	}

	/**
	 * Process incoming response to extract and store cookies
	 */
	processResponse(response: HttpResponse, requestUrl: string): HttpResponse {
		// Extract Set-Cookie headers
		const setCookieHeaders = this.extractSetCookieHeaders(response.headers);

		if (setCookieHeaders.length > 0) {
			// Parse and store cookies
			const cookies = this.cookieService.parseSetCookieHeaders(setCookieHeaders, requestUrl);

			console.log(`Stored ${cookies.length} cookies from ${requestUrl}`);
		}

		return response;
	}

	/**
	 * Extract Set-Cookie headers from response
	 */
	private extractSetCookieHeaders(headers: Record<string, string | string[]>): string[] {
		const setCookieHeaders: string[] = [];

		// Look for Set-Cookie header (case-insensitive)
		for (const [key, value] of Object.entries(headers)) {
			if (key.toLowerCase() === 'set-cookie') {
				if (Array.isArray(value)) {
					setCookieHeaders.push(...value);
				} else {
					setCookieHeaders.push(value);
				}
			}
		}

		return setCookieHeaders;
	}

	/**
	 * Clear cookies for a specific domain
	 */
	clearDomainCookies(domain: string): void {
		const cookies = this.cookieService.getCookiesByDomain(domain);
		cookies.forEach(cookie => this.cookieService.deleteCookie(cookie));
	}

	/**
	 * Get cookie statistics for UI display
	 */
	getStats() {
		return this.cookieService.getStats();
	}

	/**
	 * Check if cookies are enabled for requests
	 */
	isCookieHandlingEnabled(): boolean {
		// Could be configured via settings
		return true;
	}

	/**
	 * Export cookies for backup
	 */
	exportCookies(format: 'json' | 'netscape' | 'csv' = 'json'): string {
		return this.cookieService.exportCookies(format);
	}

	/**
	 * Import cookies from backup
	 */
	importCookies(data: string, format: 'json' | 'netscape' | 'csv' = 'json'): number {
		return this.cookieService.importCookies(data, format);
	}

	/**
	 * Cleanup expired cookies
	 */
	cleanup(): void {
		this.cookieService.cleanupExpiredCookies();
	}
}
