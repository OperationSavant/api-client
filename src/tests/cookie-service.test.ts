/**
 * Cookie Service Tests
 * Comprehensive test suite for cookie management functionality
 */

import { CookieService } from '../services/cookie-service';
import { Cookie } from '../types/cookie';

describe('CookieService', () => {
	let cookieService: CookieService;

	beforeEach(() => {
		cookieService = new CookieService();
	});

	describe('parseSetCookieHeader', () => {
		it('should parse basic Set-Cookie header', () => {
			const header = 'sessionId=abc123; Domain=.example.com; Path=/; HttpOnly; Secure';
			const cookie = cookieService.parseSetCookieHeader(header, 'https://example.com');

			expect(cookie).toBeTruthy();
			expect(cookie!).toMatchObject({
				name: 'sessionId',
				value: 'abc123',
				domain: '.example.com',
				path: '/',
				httpOnly: true,
				secure: true,
			});
		});

		it('should parse multiple Set-Cookie headers', () => {
			const headers = ['session=abc123; Path=/', 'theme=dark; Max-Age=3600', 'lang=en; Expires=Wed, 21 Oct 2024 07:28:00 GMT'];

			const cookies = cookieService.parseSetCookieHeaders(headers, 'https://example.com');
			expect(cookies).toHaveLength(3);
			expect(cookies.map(c => c.name)).toEqual(['session', 'theme', 'lang']);
		});

		it('should handle expires date parsing', () => {
			const header = 'auth=token123; Expires=Wed, 21 Oct 2024 07:28:00 GMT';
			const cookie = cookieService.parseSetCookieHeader(header, 'https://example.com');

			expect(cookie!.expires).toBeInstanceOf(Date);
			expect(cookie!.expires?.getFullYear()).toBe(2024);
		});

		it('should handle Max-Age attribute', () => {
			const header = 'temp=value; Max-Age=3600';
			const cookie = cookieService.parseSetCookieHeader(header, 'https://example.com');

			expect(cookie!.maxAge).toBe(3600);
			expect(cookie!.expires).toBeInstanceOf(Date);
		});

		it('should handle SameSite attribute', () => {
			const testCases = [
				{ header: 'csrf=token; SameSite=Strict', expected: 'Strict' },
				{ header: 'tracking=id; SameSite=Lax', expected: 'Lax' },
				{ header: 'cross=site; SameSite=None', expected: 'None' },
			];

			testCases.forEach(({ header, expected }) => {
				const cookie = cookieService.parseSetCookieHeader(header, 'https://example.com');
				expect(cookie!.sameSite).toBe(expected);
			});
		});
	});

	describe('addCookie', () => {
		it('should add new cookie', () => {
			const cookie: Partial<Cookie> = {
				name: 'test',
				value: 'value',
				domain: 'example.com',
				path: '/',
				secure: false,
				httpOnly: false,
				session: true,
			};

			cookieService.addCookie(cookie as Cookie);
			const cookies = cookieService.getAllCookies();

			expect(cookies).toHaveLength(1);
			expect(cookies[0]).toMatchObject(cookie);
		});

		it('should update existing cookie with same name/domain/path', () => {
			const cookie1: Partial<Cookie> = {
				name: 'test',
				value: 'value1',
				domain: 'example.com',
				path: '/',
				secure: false,
				httpOnly: false,
				session: true,
			};

			const cookie2: Partial<Cookie> = {
				name: 'test',
				value: 'value2',
				domain: 'example.com',
				path: '/',
				secure: true,
				httpOnly: true,
				session: false,
			};

			cookieService.addCookie(cookie1 as Cookie);
			cookieService.addCookie(cookie2 as Cookie);

			const cookies = cookieService.getAllCookies();
			expect(cookies).toHaveLength(1);
			expect(cookies[0].value).toBe('value2');
			expect(cookies[0].secure).toBe(true);
		});
	});

	describe('getCookiesForRequest', () => {
		beforeEach(() => {
			// Add test cookies with all required properties
			const cookies: Partial<Cookie>[] = [
				{
					name: 'session',
					value: 'abc123',
					domain: '.example.com',
					path: '/',
					secure: true,
					httpOnly: false,
					session: true,
				},
				{
					name: 'theme',
					value: 'dark',
					domain: 'app.example.com',
					path: '/dashboard',
					secure: false,
					httpOnly: false,
					session: true,
				},
				{
					name: 'expired',
					value: 'old',
					domain: 'example.com',
					path: '/',
					expires: new Date('2020-01-01'),
					secure: false,
					httpOnly: false,
					session: false,
				},
			];

			cookies.forEach(cookie => cookieService.addCookie(cookie as Cookie));
		});

		it('should return cookies for matching domain', () => {
			const cookies = cookieService.getCookiesForRequest('https://example.com/');
			expect(cookies).toHaveLength(1);
			expect(cookies[0].name).toBe('session');
		});

		it('should return cookies for subdomain when domain starts with dot', () => {
			const cookies = cookieService.getCookiesForRequest('https://api.example.com/');
			expect(cookies).toHaveLength(1);
			expect(cookies[0].name).toBe('session');
		});

		it('should match path correctly', () => {
			const cookies = cookieService.getCookiesForRequest('https://app.example.com/dashboard/settings');
			expect(cookies).toHaveLength(2); // Both session (.example.com) and theme (app.example.com) should match
			expect(cookies.map(c => c.name).sort()).toEqual(['session', 'theme']);
		});

		it('should exclude expired cookies', () => {
			const cookies = cookieService.getCookiesForRequest('https://example.com/');
			expect(cookies.find(c => c.name === 'expired')).toBeUndefined();
		});

		it('should respect secure flag for HTTPS', () => {
			const httpsUrl = 'https://example.com/';
			const httpUrl = 'http://example.com/';

			const httpsCookies = cookieService.getCookiesForRequest(httpsUrl);
			const httpCookies = cookieService.getCookiesForRequest(httpUrl);

			expect(httpsCookies.find(c => c.name === 'session')).toBeDefined();
			expect(httpCookies.find(c => c.name === 'session')).toBeUndefined();
		});
	});

	describe('Cookie validation', () => {
		it('should validate cookie name', () => {
			const result1 = cookieService.validateCookie({ name: '', value: 'test' } as Cookie);
			expect(result1.valid).toBe(false);
			expect(result1.errors).toContain('Cookie name is required');

			const result2 = cookieService.validateCookie({ name: 'test space', value: 'test' } as Cookie);
			expect(result2.valid).toBe(false);
			expect(result2.errors).toContain('Cookie name contains invalid characters');
		});

		it('should validate domain format', () => {
			const result = cookieService.validateCookie({
				name: 'test',
				value: 'value',
				domain: 'invalid..domain',
				path: '/', // Add required path
			} as Cookie);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Invalid domain format');
		});

		it('should validate SameSite with Secure', () => {
			const result = cookieService.validateCookie({
				name: 'test',
				value: 'value',
				domain: 'example.com',
				path: '/', // Add required path
				sameSite: 'None',
				secure: false,
			} as Cookie);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('SameSite=None requires Secure flag');
		});
	});

	describe('Import/Export', () => {
		it('should export cookies to Netscape format', () => {
			const cookie: Partial<Cookie> = {
				name: 'test',
				value: 'value',
				domain: '.example.com',
				path: '/',
				expires: new Date('2024-12-31T23:59:59Z'),
				secure: true,
				httpOnly: false,
				session: false,
			};

			cookieService.addCookie(cookie as Cookie);
			const netscape = cookieService.exportCookies('netscape');

			expect(netscape).toContain('# Netscape HTTP Cookie File');
			expect(netscape).toContain('.example.com\tTRUE\t/\tTRUE');
			expect(netscape).toContain('test\tvalue');
		});

		it('should export cookies to JSON format', () => {
			const cookie: Partial<Cookie> = {
				name: 'test',
				value: 'value',
				domain: 'example.com',
				path: '/',
				secure: false,
				httpOnly: true,
				session: true,
			};

			cookieService.addCookie(cookie as Cookie);
			const json = cookieService.exportCookies('json');
			const parsed = JSON.parse(json);

			expect(parsed).toHaveLength(1);
			expect(parsed[0]).toMatchObject({
				name: 'test',
				value: 'value',
				domain: 'example.com',
			});
		});

		it('should import cookies from JSON', async () => {
			const cookies = [
				{
					name: 'imported',
					value: 'test',
					domain: 'example.com',
					path: '/',
					secure: true,
					httpOnly: false,
					session: true,
				},
			];

			const imported = cookieService.importCookies(JSON.stringify(cookies), 'json');
			expect(imported).toBe(1);

			const allCookies = cookieService.getAllCookies();
			expect(allCookies).toHaveLength(1);
			expect(allCookies[0].name).toBe('imported');
		});
	});

	describe('Cookie filtering', () => {
		beforeEach(() => {
			const cookies: Partial<Cookie>[] = [
				{ name: 'session', value: 'abc', domain: 'example.com', path: '/', secure: true, httpOnly: true, session: true },
				{ name: 'theme', value: 'dark', domain: 'app.example.com', path: '/', secure: false, httpOnly: false, session: true },
				{ name: 'expired', value: 'old', domain: 'test.com', path: '/', expires: new Date('2020-01-01'), secure: false, httpOnly: false, session: false },
			];

			cookies.forEach(cookie => cookieService.addCookie(cookie as Cookie));
		});

		it('should filter by domain', () => {
			const filtered = cookieService.getCookiesByDomain('example.com');
			expect(filtered).toHaveLength(1); // Only exact domain matches
			expect(filtered.map(c => c.name)).toEqual(['session']);
		});

		it('should filter by security flags', () => {
			const secure = cookieService.getSecureCookies();
			const httpOnly = cookieService.getHttpOnlyCookies();

			expect(secure).toHaveLength(1);
			expect(httpOnly).toHaveLength(1);
			expect(secure[0].name).toBe('session');
			expect(httpOnly[0].name).toBe('session');
		});

		it('should get session vs persistent cookies', () => {
			const session = cookieService.getSessionCookies();
			const persistent = cookieService.getPersistentCookies();

			expect(session).toHaveLength(2);
			expect(persistent).toHaveLength(1);
			expect(persistent[0].name).toBe('expired');
		});
	});

	describe('Cookie cleanup', () => {
		it('should remove expired cookies', () => {
			const expiredCookie: Partial<Cookie> = {
				name: 'expired',
				value: 'old',
				domain: 'example.com',
				path: '/',
				expires: new Date('2020-01-01'),
				secure: false,
				httpOnly: false,
				session: false,
			};

			const validCookie: Partial<Cookie> = {
				name: 'valid',
				value: 'current',
				domain: 'example.com',
				path: '/',
				secure: false,
				httpOnly: false,
				session: true,
			};

			cookieService.addCookie(expiredCookie as Cookie);
			cookieService.addCookie(validCookie as Cookie);

			expect(cookieService.getAllCookies()).toHaveLength(2);

			cookieService.cleanupExpiredCookies();

			const remaining = cookieService.getAllCookies();
			expect(remaining).toHaveLength(1);
			expect(remaining[0].name).toBe('valid');
		});

		it('should clear all cookies', () => {
			const cookie: Partial<Cookie> = {
				name: 'test',
				value: 'value',
				domain: 'example.com',
				path: '/',
				secure: false,
				httpOnly: false,
				session: true,
			};

			cookieService.addCookie(cookie as Cookie);
			expect(cookieService.getAllCookies()).toHaveLength(1);

			cookieService.clearAllCookies();
			expect(cookieService.getAllCookies()).toHaveLength(0);
		});
	});
});
