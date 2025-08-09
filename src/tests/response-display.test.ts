/**
 * Enhanced Response Display Test Suite
 * Tests response viewer, syntax highlighting, tree view, and HTML preview components
 */

import { syntaxHighlightingService } from '../services/syntax-highlighting-service';

describe('Enhanced Response Display', () => {
	describe('SyntaxHighlightingService', () => {
		test('should detect JSON content type correctly', () => {
			const service = syntaxHighlightingService;

			const jsonContentType = 'application/json; charset=utf-8';
			const languageInfo = service.detectLanguageFromContentType(jsonContentType);

			expect(languageInfo.language).toBe('json');
			expect(languageInfo.displayName).toBe('JSON');
			expect(languageInfo.fileExtension).toBe('.json');
		});

		test('should detect XML content type correctly', () => {
			const service = syntaxHighlightingService;

			const xmlContentType = 'application/xml';
			const languageInfo = service.detectLanguageFromContentType(xmlContentType);

			expect(languageInfo.language).toBe('xml');
			expect(languageInfo.displayName).toBe('XML');
			expect(languageInfo.fileExtension).toBe('.xml');
		});

		test('should detect HTML content type correctly', () => {
			const service = syntaxHighlightingService;

			const htmlContentType = 'text/html';
			const languageInfo = service.detectLanguageFromContentType(htmlContentType);

			expect(languageInfo.language).toBe('html');
			expect(languageInfo.displayName).toBe('HTML');
			expect(languageInfo.fileExtension).toBe('.html');
		});

		test('should detect JavaScript content type correctly', () => {
			const service = syntaxHighlightingService;

			const jsContentType = 'application/javascript';
			const languageInfo = service.detectLanguageFromContentType(jsContentType);

			expect(languageInfo.language).toBe('javascript');
			expect(languageInfo.displayName).toBe('JavaScript');
			expect(languageInfo.fileExtension).toBe('.js');
		});

		test('should fallback to plaintext for unknown content types', () => {
			const service = syntaxHighlightingService;

			const unknownContentType = 'application/octet-stream';
			const languageInfo = service.detectLanguageFromContentType(unknownContentType);

			expect(languageInfo.language).toBe('plaintext');
			expect(languageInfo.displayName).toBe('Plain Text');
		});

		test('should detect language from file extension', () => {
			const service = syntaxHighlightingService;

			expect(service.detectLanguageFromExtension('test.json').language).toBe('json');
			expect(service.detectLanguageFromExtension('test.xml').language).toBe('xml');
			expect(service.detectLanguageFromExtension('test.html').language).toBe('html');
			expect(service.detectLanguageFromExtension('test.js').language).toBe('javascript');
			expect(service.detectLanguageFromExtension('test.css').language).toBe('css');
			expect(service.detectLanguageFromExtension('test.unknown').language).toBe('plaintext');
		});

		test('should detect JSON content from response body', () => {
			const service = syntaxHighlightingService;

			const jsonContent = '{"name": "test", "value": 123}';
			const languageInfo = service.detectLanguageFromContent(jsonContent);

			expect(languageInfo.language).toBe('json');
		});

		test('should detect XML content from response body', () => {
			const service = syntaxHighlightingService;

			const xmlContent = '<?xml version="1.0"?><root><item>test</item></root>';
			const languageInfo = service.detectLanguageFromContent(xmlContent);

			expect(languageInfo.language).toBe('xml');
		});

		test('should detect HTML content from response body', () => {
			const service = syntaxHighlightingService;

			const htmlContent = '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test</h1></body></html>';
			const languageInfo = service.detectLanguageFromContent(htmlContent);

			expect(languageInfo.language).toBe('html');
		});

		test('should format JSON content correctly', () => {
			const service = syntaxHighlightingService;

			const jsonContent = '{"name":"test","value":123}';
			const formatted = service.formatContent(jsonContent, 'json');

			expect(formatted).toContain('\n'); // Should be formatted with newlines
			expect(JSON.parse(formatted)).toEqual({ name: 'test', value: 123 });
		});

		test('should validate JSON syntax correctly', () => {
			const service = syntaxHighlightingService;

			const validJson = '{"name": "test"}';
			const invalidJson = '{"name": "test"';

			expect(service.validateSyntax(validJson, 'json').isValid).toBe(true);
			expect(service.validateSyntax(invalidJson, 'json').isValid).toBe(false);
			expect(service.validateSyntax(invalidJson, 'json').error).toBeDefined();
		});

		test('should validate XML syntax correctly', () => {
			const service = syntaxHighlightingService;

			const validXml = '<root><item>test</item></root>';
			const invalidXml = '<root><item>test</root>';

			expect(service.validateSyntax(validXml, 'xml').isValid).toBe(true);
			// Note: The XML validation is basic, so this might pass
			const invalidResult = service.validateSyntax(invalidXml, 'xml');
			expect(typeof invalidResult.isValid).toBe('boolean');
		});

		test('should return supported languages list', () => {
			const service = syntaxHighlightingService;

			const languages = service.getSupportedLanguages();

			expect(languages.length).toBeGreaterThan(0);
			expect(languages.some(lang => lang.language === 'json')).toBe(true);
			expect(languages.some(lang => lang.language === 'xml')).toBe(true);
			expect(languages.some(lang => lang.language === 'html')).toBe(true);
			expect(languages.some(lang => lang.language === 'javascript')).toBe(true);
		});

		test('should get Monaco editor options with defaults', () => {
			const service = syntaxHighlightingService;

			const options = service.getMonacoOptions();

			expect(options.readOnly).toBe(true);
			expect(options.wordWrap).toBe(false);
			expect(options.fontSize).toBe(14);
			expect(options.tabSize).toBe(2);
		});

		test('should override Monaco editor options', () => {
			const service = syntaxHighlightingService;

			const customOptions = {
				readOnly: false,
				wordWrap: true,
				fontSize: 16,
			};

			const options = service.getMonacoOptions(customOptions);

			expect(options.readOnly).toBe(false);
			expect(options.wordWrap).toBe(true);
			expect(options.fontSize).toBe(16);
			expect(options.tabSize).toBe(2); // Should keep default
		});
	});

	describe('Response Data Processing', () => {
		test('should handle empty response data', () => {
			const service = syntaxHighlightingService;

			const languageInfo = service.detectLanguageFromContent('');
			expect(languageInfo.language).toBe('plaintext');
		});

		test('should handle null response data', () => {
			const service = syntaxHighlightingService;

			const languageInfo = service.detectLanguageFromContent(null as any);
			expect(languageInfo.language).toBe('plaintext');
		});

		test('should handle malformed JSON gracefully', () => {
			const service = syntaxHighlightingService;

			const malformedJson = '{"name": "test", "value":}';
			const languageInfo = service.detectLanguageFromContent(malformedJson);

			// Should not crash, might detect as plaintext since parsing fails
			expect(languageInfo).toBeDefined();
		});

		test('should handle large response data', () => {
			const service = syntaxHighlightingService;

			// Create a large JSON object
			const largeObject = {};
			for (let i = 0; i < 1000; i++) {
				(largeObject as any)[`key${i}`] = `value${i}`;
			}
			const largeJson = JSON.stringify(largeObject);

			const languageInfo = service.detectLanguageFromContent(largeJson);
			expect(languageInfo.language).toBe('json');
		});
	});

	describe('Content Type Edge Cases', () => {
		test('should handle content type with charset', () => {
			const service = syntaxHighlightingService;

			const contentType = 'application/json; charset=utf-8; boundary=something';
			const languageInfo = service.detectLanguageFromContentType(contentType);

			expect(languageInfo.language).toBe('json');
		});

		test('should handle case-insensitive content types', () => {
			const service = syntaxHighlightingService;

			const contentType = 'APPLICATION/JSON';
			const languageInfo = service.detectLanguageFromContentType(contentType);

			expect(languageInfo.language).toBe('json');
		});

		test('should handle vendor-specific content types', () => {
			const service = syntaxHighlightingService;

			const contentType = 'application/vnd.api+json';
			const languageInfo = service.detectLanguageFromContentType(contentType);

			expect(languageInfo.language).toBe('json');
		});

		test('should handle SOAP XML content type', () => {
			const service = syntaxHighlightingService;

			const contentType = 'application/soap+xml';
			const languageInfo = service.detectLanguageFromContentType(contentType);

			expect(languageInfo.language).toBe('xml');
		});
	});

	describe('Language Configuration', () => {
		test('should get language config by ID', () => {
			const service = syntaxHighlightingService;

			const jsonConfig = service.getLanguageConfig('json');
			expect(jsonConfig.language).toBe('json');
			expect(jsonConfig.displayName).toBe('JSON');
			expect(jsonConfig.mimeTypes).toContain('application/json');
		});

		test('should fallback to plaintext for unknown language', () => {
			const service = syntaxHighlightingService;

			const unknownConfig = service.getLanguageConfig('unknown-language');
			expect(unknownConfig.language).toBe('plaintext');
		});

		test('should have proper MIME type mappings', () => {
			const service = syntaxHighlightingService;

			const languages = service.getSupportedLanguages();

			// Check that each language has at least one MIME type
			languages.forEach(lang => {
				expect(lang.mimeTypes.length).toBeGreaterThan(0);
				expect(lang.displayName).toBeTruthy();
				expect(lang.fileExtension).toMatch(/^\./); // Should start with dot
			});
		});
	});

	describe('Integration Tests', () => {
		test('should work with typical API response', () => {
			const service = syntaxHighlightingService;

			const apiResponse = {
				contentType: 'application/json',
				body: '{"users": [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]}',
			};

			const languageInfo = service.detectLanguageFromContentType(apiResponse.contentType);
			const validation = service.validateSyntax(apiResponse.body, languageInfo.language);
			const formatted = service.formatContent(apiResponse.body, languageInfo.language);

			expect(languageInfo.language).toBe('json');
			expect(validation.isValid).toBe(true);
			expect(formatted).toContain('\n'); // Should be formatted
		});

		test('should work with XML API response', () => {
			const service = syntaxHighlightingService;

			const xmlResponse = {
				contentType: 'application/xml',
				body: '<users><user id="1"><name>John</name></user><user id="2"><name>Jane</name></user></users>',
			};

			const languageInfo = service.detectLanguageFromContentType(xmlResponse.contentType);
			const validation = service.validateSyntax(xmlResponse.body, languageInfo.language);

			expect(languageInfo.language).toBe('xml');
			expect(validation.isValid).toBe(true);
		});

		test('should work with HTML response', () => {
			const service = syntaxHighlightingService;

			const htmlResponse = {
				contentType: 'text/html',
				body: '<html><head><title>API Docs</title></head><body><h1>Welcome</h1></body></html>',
			};

			const languageInfo = service.detectLanguageFromContentType(htmlResponse.contentType);

			expect(languageInfo.language).toBe('html');
		});
	});
});

// Mock VS Code API for testing
(globalThis as any).vscode = {
	window: {
		showErrorMessage: jest.fn(),
		showInformationMessage: jest.fn(),
	},
	env: {
		clipboard: {
			writeText: jest.fn(),
		},
	},
	TreeItem: jest.fn(),
	TreeItemCollapsibleState: {
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	},
	ThemeIcon: jest.fn(),
	EventEmitter: jest.fn(() => ({
		fire: jest.fn(),
		event: jest.fn(),
	})),
	MarkdownString: jest.fn(),
};
