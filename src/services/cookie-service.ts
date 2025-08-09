/**
 * Cookie Service
 * Handles cookie storage, parsing, and management operations
 */

import { Cookie, CookieJar, CookieFilter, CookieStats, SetCookieHeader, CookieValidationResult } from '../types/cookie';

export class CookieService {
	private cookies: Map<string, Cookie> = new Map();

	/**
	 * Parse Set-Cookie header(s) and add to jar
	 */
	parseSetCookieHeaders(setCookieHeaders: string | string[], requestUrl: string): Cookie[] {
		const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
		const cookies: Cookie[] = [];

		for (const header of headers) {
			const cookie = this.parseSetCookieHeader(header, requestUrl);
			if (cookie) {
				cookies.push(cookie);
			}
		}

		return cookies;
	}

	/**
	 * Parse single Set-Cookie header and add to jar
	 */
	parseSetCookieHeader(setCookieHeader: string, requestUrl: string): Cookie | null {
		try {
			const parsed = this.parseSetCookieString(setCookieHeader);
			if (!parsed) return null;

			const url = new URL(requestUrl);
			const domain = this.deriveDomain((parsed.attributes.domain as string) || url.hostname);
			const path = (parsed.attributes.path as string) || this.derivePath(url.pathname);

			const expires = this.parseExpires(parsed.attributes.expires as string);
			const maxAge = this.parseMaxAge(parsed.attributes['max-age'] as string);

			// If maxAge is provided, compute expires from it
			let computedExpires = expires;
			if (maxAge !== undefined) {
				computedExpires = new Date(Date.now() + maxAge * 1000);
			}

			const cookie: Cookie = {
				name: parsed.name,
				value: parsed.value,
				domain,
				path,
				expires: computedExpires,
				maxAge,
				secure: parsed.attributes.secure === true,
				httpOnly: parsed.attributes.httponly === true,
				sameSite: this.parseSameSite(parsed.attributes.samesite as string),
				priority: this.parsePriority(parsed.attributes.priority as string),
				partitioned: parsed.attributes.partitioned === true,
				created: new Date(),
				lastAccessed: new Date(),
				hostOnly: !parsed.attributes.domain,
				session: !parsed.attributes.expires && !parsed.attributes['max-age'],
			};

			// Validate cookie before adding
			const validation = this.validateCookie(cookie);
			if (!validation.valid) {
				console.warn('Invalid cookie:', validation.errors);
				return null;
			}

			this.addCookie(cookie);
			return cookie;
		} catch (error) {
			console.error('Error parsing Set-Cookie header:', error);
			return null;
		}
	}

	/**
	 * Add or update a cookie in the jar
	 */
	addCookie(cookie: Cookie): void {
		const key = this.getCookieKey(cookie);
		this.cookies.set(key, { ...cookie, lastAccessed: new Date() });
	}

	/**
	 * Get cookies for a specific domain and path
	 */
	getCookiesForRequest(url: string): Cookie[] {
		const parsedUrl = new URL(url);
		const domain = parsedUrl.hostname;
		const path = parsedUrl.pathname;
		const isSecure = parsedUrl.protocol === 'https:';

		return Array.from(this.cookies.values()).filter(cookie => {
			// Check if cookie is expired
			if (this.isCookieExpired(cookie)) {
				this.deleteCookie(cookie);
				return false;
			}

			// Check domain match
			if (!this.domainMatches(cookie.domain, domain)) {
				return false;
			}

			// Check path match
			if (!this.pathMatches(cookie.path, path)) {
				return false;
			}

			// Check secure flag
			if (cookie.secure && !isSecure) {
				return false;
			}

			// Update last accessed time
			cookie.lastAccessed = new Date();
			return true;
		});
	}

	/**
	 * Get all cookies with optional filtering
	 */
	getAllCookies(filter?: CookieFilter): Cookie[] {
		let cookies = Array.from(this.cookies.values());

		if (filter) {
			cookies = cookies.filter(cookie => {
				if (filter.domain && !cookie.domain.includes(filter.domain)) return false;
				if (filter.name && !cookie.name.toLowerCase().includes(filter.name.toLowerCase())) return false;
				if (filter.value && !cookie.value.toLowerCase().includes(filter.value.toLowerCase())) return false;
				if (filter.secure !== undefined && cookie.secure !== filter.secure) return false;
				if (filter.httpOnly !== undefined && cookie.httpOnly !== filter.httpOnly) return false;
				if (filter.session !== undefined && cookie.session !== filter.session) return false;
				if (filter.expired !== undefined) {
					const isExpired = this.isCookieExpired(cookie);
					if (isExpired !== filter.expired) return false;
				}
				return true;
			});
		}

		return cookies.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
	}

	/**
	 * Delete a specific cookie
	 */
	deleteCookie(cookie: Cookie): boolean {
		const key = this.getCookieKey(cookie);
		return this.cookies.delete(key);
	}

	/**
	 * Delete cookies by filter
	 */
	deleteCookies(filter: CookieFilter): number {
		const cookiesToDelete = this.getAllCookies(filter);
		let deletedCount = 0;

		cookiesToDelete.forEach(cookie => {
			if (this.deleteCookie(cookie)) {
				deletedCount++;
			}
		});

		return deletedCount;
	}

	/**
	 * Clear all cookies
	 */
	clearAll(): void {
		this.cookies.clear();
	}

	/**
	 * Clear all cookies (alias for clearAll)
	 */
	clearAllCookies(): void {
		this.clearAll();
	}

	/**
	 * Remove expired cookies
	 */
	cleanupExpiredCookies(): void {
		const now = new Date();
		const toDelete: string[] = [];

		for (const [key, cookie] of this.cookies.entries()) {
			if (cookie.expires && cookie.expires < now) {
				toDelete.push(key);
			}
		}

		toDelete.forEach(key => this.cookies.delete(key));
	}

	/**
	 * Get cookies by domain
	 */
	getCookiesByDomain(domain: string): Cookie[] {
		return this.getAllCookies().filter(cookie => {
			// Exact domain match
			if (cookie.domain === domain) return true;

			// Cookie domain starts with . and current domain ends with it (subdomain match)
			if (cookie.domain.startsWith('.') && domain.endsWith(cookie.domain.substring(1))) {
				return true;
			}

			return false;
		});
	}

	/**
	 * Get secure cookies only
	 */
	getSecureCookies(): Cookie[] {
		return this.getAllCookies().filter(cookie => cookie.secure);
	}

	/**
	 * Get HTTP-only cookies
	 */
	getHttpOnlyCookies(): Cookie[] {
		return this.getAllCookies().filter(cookie => cookie.httpOnly);
	}

	/**
	 * Get session cookies
	 */
	getSessionCookies(): Cookie[] {
		return this.getAllCookies().filter(cookie => cookie.session);
	}

	/**
	 * Get persistent cookies (with expires/maxAge)
	 */
	getPersistentCookies(): Cookie[] {
		return this.getAllCookies().filter(cookie => !cookie.session);
	}

	/**
	 * Get cookie statistics
	 */
	getStats(): CookieStats {
		const cookies = Array.from(this.cookies.values());
		const domains = new Set(cookies.map(c => c.domain));

		return {
			total: cookies.length,
			session: cookies.filter(c => c.session).length,
			persistent: cookies.filter(c => !c.session).length,
			secure: cookies.filter(c => c.secure).length,
			httpOnly: cookies.filter(c => c.httpOnly).length,
			sameSiteStrict: cookies.filter(c => c.sameSite === 'Strict').length,
			sameSiteLax: cookies.filter(c => c.sameSite === 'Lax').length,
			sameSiteNone: cookies.filter(c => c.sameSite === 'None').length,
			expired: cookies.filter(c => this.isCookieExpired(c)).length,
			domains: domains.size,
		};
	}

	/**
	 * Export cookies in various formats
	 */
	exportCookies(format: 'json' | 'netscape' | 'csv', filter?: CookieFilter): string {
		const cookies = this.getAllCookies(filter);

		switch (format) {
			case 'json':
				return JSON.stringify(cookies, null, 2);

			case 'netscape':
				return this.exportNetscape(cookies);

			case 'csv':
				return this.exportCSV(cookies);

			default:
				throw new Error(`Unsupported export format: ${format}`);
		}
	}

	/**
	 * Import cookies from various formats
	 */
	importCookies(data: string, format: 'json' | 'netscape' | 'csv'): number {
		try {
			let cookies: Cookie[] = [];

			switch (format) {
				case 'json':
					cookies = JSON.parse(data);
					break;

				case 'netscape':
					cookies = this.parseNetscape(data);
					break;

				case 'csv':
					cookies = this.parseCSV(data);
					break;

				default:
					throw new Error(`Unsupported import format: ${format}`);
			}

			let importedCount = 0;
			cookies.forEach(cookie => {
				const validation = this.validateCookie(cookie);
				if (validation.valid) {
					this.addCookie(cookie);
					importedCount++;
				}
			});

			return importedCount;
		} catch (error) {
			console.error('Error importing cookies:', error);
			return 0;
		}
	}

	/**
	 * Generate Cookie header string for request
	 */
	getCookieHeader(url: string): string {
		const cookies = this.getCookiesForRequest(url);
		return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
	}

	/**
	 * Validate cookie properties
	 */
	validateCookie(cookie: Cookie): CookieValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Name validation
		if (!cookie.name || cookie.name.trim() === '') {
			errors.push('Cookie name is required');
		} else if (!/^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/.test(cookie.name)) {
			errors.push('Cookie name contains invalid characters');
		}

		// Domain validation (optional)
		if (cookie.domain && !/^\.?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cookie.domain)) {
			errors.push('Invalid domain format');
		}

		// Additional domain validation - no consecutive dots
		if (cookie.domain && cookie.domain.includes('..')) {
			errors.push('Invalid domain format');
		}

		// Path validation (ensure path is provided)
		if (!cookie.path || cookie.path.trim() === '') {
			errors.push('Cookie path is required');
		}

		// SameSite + Secure validation
		if (cookie.sameSite === 'None' && !cookie.secure) {
			errors.push('SameSite=None requires Secure flag');
		}

		// Expiration validation
		if (cookie.expires && cookie.maxAge) {
			warnings.push('Both expires and max-age are set, max-age takes precedence');
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	// Private helper methods

	private parseSetCookieString(setCookie: string): SetCookieHeader | null {
		const parts = setCookie.split(';').map(part => part.trim());
		if (parts.length === 0) return null;

		const [nameValue] = parts;
		const equalIndex = nameValue.indexOf('=');
		if (equalIndex === -1) return null;

		const name = nameValue.substring(0, equalIndex).trim();
		const value = nameValue.substring(equalIndex + 1).trim();

		const attributes: Record<string, string | boolean> = {};

		for (let i = 1; i < parts.length; i++) {
			const part = parts[i];
			const eqIndex = part.indexOf('=');

			if (eqIndex === -1) {
				// Boolean attribute
				attributes[part.toLowerCase()] = true;
			} else {
				// Key-value attribute
				const key = part.substring(0, eqIndex).trim().toLowerCase();
				const val = part.substring(eqIndex + 1).trim();
				attributes[key] = val;
			}
		}

		return { name, value, attributes };
	}

	private deriveDomain(domain: string): string {
		if (!domain) return '';
		return domain.startsWith('.') ? domain : domain;
	}

	private derivePath(path: string): string {
		if (!path || path === '/') return '/';
		return path.endsWith('/') ? path : path + '/';
	}

	private parseExpires(expires?: string): Date | undefined {
		if (!expires) return undefined;
		const date = new Date(expires);
		return isNaN(date.getTime()) ? undefined : date;
	}

	private parseMaxAge(maxAge?: string): number | undefined {
		if (!maxAge) return undefined;
		const age = parseInt(maxAge, 10);
		return isNaN(age) ? undefined : age;
	}

	private parseSameSite(sameSite?: string): 'Strict' | 'Lax' | 'None' | undefined {
		if (!sameSite) return undefined;
		const normalized = sameSite.toLowerCase();
		if (normalized === 'strict') return 'Strict';
		if (normalized === 'lax') return 'Lax';
		if (normalized === 'none') return 'None';
		return undefined;
	}

	private parsePriority(priority?: string): 'Low' | 'Medium' | 'High' | undefined {
		if (!priority) return undefined;
		const normalized = priority.toLowerCase();
		if (normalized === 'low') return 'Low';
		if (normalized === 'medium') return 'Medium';
		if (normalized === 'high') return 'High';
		return undefined;
	}

	private getCookieKey(cookie: Cookie): string {
		return `${cookie.domain}:${cookie.path}:${cookie.name}`;
	}

	private isCookieExpired(cookie: Cookie): boolean {
		if (cookie.session) return false;

		if (cookie.expires) {
			return new Date() > cookie.expires;
		}

		if (cookie.maxAge) {
			const expiryTime = cookie.created.getTime() + cookie.maxAge * 1000;
			return new Date().getTime() > expiryTime;
		}

		return false;
	}

	private domainMatches(cookieDomain: string, requestDomain: string): boolean {
		if (cookieDomain === requestDomain) return true;
		if (cookieDomain.startsWith('.')) {
			return requestDomain.endsWith(cookieDomain.substring(1));
		}
		return false;
	}

	private pathMatches(cookiePath: string, requestPath: string): boolean {
		if (cookiePath === '/') return true;
		if (requestPath === cookiePath) return true;
		if (requestPath.startsWith(cookiePath)) {
			return cookiePath.endsWith('/') || requestPath[cookiePath.length] === '/';
		}
		return false;
	}

	private exportNetscape(cookies: Cookie[]): string {
		const header = '# Netscape HTTP Cookie File\n# This is a generated file!  Do not edit.\n\n';
		const lines = cookies.map(cookie => {
			const domain = cookie.hostOnly ? cookie.domain : `.${cookie.domain}`;
			const flag = cookie.hostOnly ? 'FALSE' : 'TRUE';
			const path = cookie.path;
			const secure = cookie.secure ? 'TRUE' : 'FALSE';
			const expires = cookie.expires ? Math.floor(cookie.expires.getTime() / 1000).toString() : '0';
			const name = cookie.name;
			const value = cookie.value;

			return `${domain}\t${flag}\t${path}\t${secure}\t${expires}\t${name}\t${value}`;
		});

		return header + lines.join('\n');
	}

	private exportCSV(cookies: Cookie[]): string {
		const headers = ['Name', 'Value', 'Domain', 'Path', 'Expires', 'Secure', 'HttpOnly', 'SameSite'];
		const rows = cookies.map(cookie => [
			cookie.name,
			cookie.value,
			cookie.domain,
			cookie.path,
			cookie.expires ? cookie.expires.toISOString() : '',
			cookie.secure.toString(),
			cookie.httpOnly.toString(),
			cookie.sameSite || '',
		]);

		return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
	}

	private parseNetscape(data: string): Cookie[] {
		const lines = data.split('\n').filter(line => line.trim() && !line.startsWith('#'));
		return lines
			.map(line => {
				const parts = line.split('\t');
				if (parts.length < 7) return null;

				const [domain, flag, path, secure, expires, name, value] = parts;

				return {
					name,
					value,
					domain: domain.startsWith('.') ? domain.substring(1) : domain,
					path,
					expires: expires !== '0' ? new Date(parseInt(expires, 10) * 1000) : undefined,
					secure: secure === 'TRUE',
					httpOnly: false,
					created: new Date(),
					lastAccessed: new Date(),
					hostOnly: flag === 'FALSE',
					session: expires === '0',
				} as Cookie;
			})
			.filter(Boolean) as Cookie[];
	}

	private parseCSV(data: string): Cookie[] {
		const lines = data.split('\n').filter(line => line.trim());
		if (lines.length < 2) return [];

		const headers = lines[0].split(',');
		return lines.slice(1).map(line => {
			const values = line.split(',');
			const cookie: Partial<Cookie> = {
				created: new Date(),
				lastAccessed: new Date(),
			};

			headers.forEach((header, index) => {
				const value = values[index] || '';
				switch (header.toLowerCase()) {
					case 'name':
						cookie.name = value;
						break;
					case 'value':
						cookie.value = value;
						break;
					case 'domain':
						cookie.domain = value;
						break;
					case 'path':
						cookie.path = value;
						break;
					case 'expires':
						cookie.expires = value ? new Date(value) : undefined;
						break;
					case 'secure':
						cookie.secure = value.toLowerCase() === 'true';
						break;
					case 'httponly':
						cookie.httpOnly = value.toLowerCase() === 'true';
						break;
					case 'samesite':
						cookie.sameSite = value as 'Strict' | 'Lax' | 'None';
						break;
				}
			});

			return cookie as Cookie;
		});
	}
}

// Export singleton instance
export const cookieService = new CookieService();
