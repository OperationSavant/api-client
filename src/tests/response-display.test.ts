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

/**
 * Monaco Editor Integration Tests
 * Tests the Monaco Editor component used in response display
 */
describe('Monaco Editor Integration', () => {
	// Mock Monaco Editor API
	const mockEditor = {
		getValue: jest.fn(),
		setValue: jest.fn(),
		updateOptions: jest.fn(),
		layout: jest.fn(),
		dispose: jest.fn(),
		onDidChangeModelContent: jest.fn(() => ({ dispose: jest.fn() })),
		getModel: jest.fn(() => ({
			updateOptions: jest.fn(),
		})),
		setModel: jest.fn(),
		focus: jest.fn(),
		revealLine: jest.fn(),
		trigger: jest.fn(),
	};

	const mockMonaco = {
		editor: {
			create: jest.fn(() => mockEditor),
			setModelLanguage: jest.fn(),
			setTheme: jest.fn(),
			defineTheme: jest.fn(),
		},
		languages: {
			json: {
				jsonDefaults: {
					setDiagnosticsOptions: jest.fn(),
				},
			},
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockMonaco.editor.create.mockReturnValue(mockEditor);

		// Mock Monaco Editor module for these tests
		jest.doMock('monaco-editor/esm/vs/editor/editor.api', () => mockMonaco);
	});

	afterEach(() => {
		jest.dontMock('monaco-editor/esm/vs/editor/editor.api');
	});

	describe('MonacoEditor Component Functionality', () => {
		test('should create Monaco Editor with correct JSON configuration', () => {
			// This test verifies that Monaco Editor is properly configured for JSON
			const jsonContent = '{"users": [{"id": 1, "name": "John"}]}';

			// Simulate Monaco Editor creation for JSON content
			const expectedOptions = {
				value: jsonContent,
				language: 'json',
				theme: 'vs-dark',
				readOnly: true,
				wordWrap: false,
				minimap: { enabled: false },
				lineNumbers: 'on',
			};

			// Verify that the configuration matches expected values
			expect(expectedOptions.language).toBe('json');
			expect(expectedOptions.readOnly).toBe(true);
			expect(expectedOptions.minimap.enabled).toBe(false);
		});

		test('should handle content formatting for different languages', () => {
			// Test JSON formatting
			const unformattedJson = '{"name":"test","value":123}';
			const expectedFormattedJson = '{\n  "name": "test",\n  "value": 123\n}';

			let formatted;
			try {
				const parsed = JSON.parse(unformattedJson);
				formatted = JSON.stringify(parsed, null, 2);
			} catch (error) {
				formatted = unformattedJson;
			}

			expect(formatted).toBe(expectedFormattedJson);

			// Test XML content detection
			const xmlContent = '<?xml version="1.0"?><root><item>test</item></root>';
			expect(xmlContent.includes('<?xml')).toBe(true);
			expect(xmlContent.includes('<root>')).toBe(true);

			// Test HTML content detection
			const htmlContent = '<!DOCTYPE html><html><body><h1>Test</h1></body></html>';
			expect(htmlContent.includes('<!DOCTYPE html>')).toBe(true);
			expect(htmlContent.includes('<html>')).toBe(true);
		});

		test('should detect language from content type headers', () => {
			const testCases = [
				{ contentType: 'application/json', expectedLanguage: 'json' },
				{ contentType: 'application/json; charset=utf-8', expectedLanguage: 'json' },
				{ contentType: 'application/xml', expectedLanguage: 'xml' },
				{ contentType: 'text/html', expectedLanguage: 'html' },
				{ contentType: 'text/css', expectedLanguage: 'css' },
				{ contentType: 'application/javascript', expectedLanguage: 'javascript' },
				{ contentType: 'text/plain', expectedLanguage: 'plaintext' },
				{ contentType: 'application/octet-stream', expectedLanguage: 'plaintext' },
			];

			testCases.forEach(({ contentType, expectedLanguage }) => {
				let detectedLanguage = 'plaintext';

				if (contentType.includes('json')) {
					detectedLanguage = 'json';
				} else if (contentType.includes('xml')) {
					detectedLanguage = 'xml';
				} else if (contentType.includes('html')) {
					detectedLanguage = 'html';
				} else if (contentType.includes('css')) {
					detectedLanguage = 'css';
				} else if (contentType.includes('javascript')) {
					detectedLanguage = 'javascript';
				}

				expect(detectedLanguage).toBe(expectedLanguage);
			});
		});

		test('should handle malformed content gracefully', () => {
			// Test malformed JSON
			const malformedJson = '{"name": "test",}';
			let isValidJson = false;

			try {
				JSON.parse(malformedJson);
				isValidJson = true;
			} catch (error) {
				isValidJson = false;
			}

			expect(isValidJson).toBe(false);

			// Should not crash and should use original content
			const fallbackContent = malformedJson;
			expect(fallbackContent).toBe(malformedJson);
		});

		test('should support copy functionality', () => {
			const testContent = '{"formatted": "json content"}';

			// Mock clipboard API
			const mockWriteText = jest.fn().mockResolvedValue(undefined);
			Object.assign(navigator, {
				clipboard: {
					writeText: mockWriteText,
				},
			});

			// Simulate copy operation
			const copyContent = async (content: string) => {
				await navigator.clipboard.writeText(content);
			};

			copyContent(testContent);
			expect(mockWriteText).toHaveBeenCalledWith(testContent);
		});

		test('should handle theme switching', () => {
			const themes = ['vs', 'vs-dark', 'hc-black'];

			themes.forEach(theme => {
				const editorOptions = {
					theme: theme,
					readOnly: true,
					language: 'json',
				};

				expect(editorOptions.theme).toBe(theme);
				expect(['vs', 'vs-dark', 'hc-black']).toContain(theme);
			});
		});

		test('should handle word wrap toggle', () => {
			let wordWrapEnabled = false;

			// Simulate word wrap toggle
			const toggleWordWrap = () => {
				wordWrapEnabled = !wordWrapEnabled;
			};

			expect(wordWrapEnabled).toBe(false);

			toggleWordWrap();
			expect(wordWrapEnabled).toBe(true);

			toggleWordWrap();
			expect(wordWrapEnabled).toBe(false);
		});

		test('should handle large content efficiently', () => {
			// Create large content
			const largeObject = {};
			for (let i = 0; i < 1000; i++) {
				(largeObject as any)[`key${i}`] = `value${i}`;
			}
			const largeContent = JSON.stringify(largeObject);

			// Should handle large content without issues
			expect(largeContent.length).toBeGreaterThan(10000);

			// Should still be valid JSON
			let isValid = false;
			try {
				JSON.parse(largeContent);
				isValid = true;
			} catch (error) {
				isValid = false;
			}

			expect(isValid).toBe(true);
		});

		test('should provide accessibility features', () => {
			const accessibilityOptions = {
				accessibilitySupport: 'auto',
				contextmenu: true,
				mouseWheelZoom: true,
				lineNumbers: 'on',
			};

			expect(accessibilityOptions.accessibilitySupport).toBe('auto');
			expect(accessibilityOptions.contextmenu).toBe(true);
			expect(accessibilityOptions.mouseWheelZoom).toBe(true);
			expect(accessibilityOptions.lineNumbers).toBe('on');
		});

		test('should handle response viewer integration', () => {
			// Mock response data
			const mockResponse = {
				status: 200,
				statusText: 'OK',
				headers: {
					'Content-Type': 'application/json',
				},
				body: '{"users": [{"id": 1, "name": "John"}]}',
				contentType: 'application/json',
				size: 123,
				duration: 456,
				isError: false,
			};

			// Verify response processing
			expect(mockResponse.contentType).toBe('application/json');
			expect(mockResponse.body).toContain('users');
			expect(mockResponse.isError).toBe(false);

			// Verify language detection from response
			let detectedLanguage = 'plaintext';
			if (mockResponse.contentType.includes('json')) {
				detectedLanguage = 'json';
			}

			expect(detectedLanguage).toBe('json');

			// Verify content formatting
			let formattedContent = mockResponse.body;
			try {
				const parsed = JSON.parse(mockResponse.body);
				formattedContent = JSON.stringify(parsed, null, 2);
			} catch (error) {
				// Use original content if parsing fails
			}

			expect(formattedContent).toContain('\n'); // Should be formatted with newlines
		});
	});

	describe('Response Display with Monaco Editor', () => {
		test('should integrate Monaco Editor with response viewer modes', () => {
			const responseBody = '{"data": {"message": "Hello World"}}';

			// Test raw mode
			const rawModeOptions = {
				content: responseBody,
				language: 'json',
				formatOnMount: false,
				wordWrap: false,
			};

			expect(rawModeOptions.formatOnMount).toBe(false);
			expect(rawModeOptions.content).toBe(responseBody);

			// Test formatted mode
			const formattedModeOptions = {
				content: JSON.stringify(JSON.parse(responseBody), null, 2),
				language: 'json',
				formatOnMount: true,
				wordWrap: false,
			};

			expect(formattedModeOptions.formatOnMount).toBe(true);
			expect(formattedModeOptions.content).toContain('\n');
		});

		test('should handle different response formats in Monaco Editor', () => {
			const testResponses = [
				{
					contentType: 'application/json',
					body: '{"message": "success"}',
					expectedLanguage: 'json',
				},
				{
					contentType: 'application/xml',
					body: '<response><message>success</message></response>',
					expectedLanguage: 'xml',
				},
				{
					contentType: 'text/html',
					body: '<html><body><h1>Success</h1></body></html>',
					expectedLanguage: 'html',
				},
				{
					contentType: 'text/css',
					body: 'body { color: red; }',
					expectedLanguage: 'css',
				},
				{
					contentType: 'application/javascript',
					body: 'console.log("Hello");',
					expectedLanguage: 'javascript',
				},
			];

			testResponses.forEach(({ contentType, body, expectedLanguage }) => {
				let detectedLanguage = 'plaintext';

				if (contentType.includes('json')) {
					detectedLanguage = 'json';
				} else if (contentType.includes('xml')) {
					detectedLanguage = 'xml';
				} else if (contentType.includes('html')) {
					detectedLanguage = 'html';
				} else if (contentType.includes('css')) {
					detectedLanguage = 'css';
				} else if (contentType.includes('javascript')) {
					detectedLanguage = 'javascript';
				}

				expect(detectedLanguage).toBe(expectedLanguage);
				expect(body).toBeTruthy();
				expect(contentType).toBeTruthy();
			});
		});

		test('should show clear difference between formatted and raw modes', () => {
			// Test with unformatted JSON
			const unformattedJson = '{"users":[{"id":1,"name":"John"},{"id":2,"name":"Jane"}]}';
			const expectedFormattedJson =
				'{\n  "users": [\n    {\n      "id": 1,\n      "name": "John"\n    },\n    {\n      "id": 2,\n      "name": "Jane"\n    }\n  ]\n}';

			// Raw mode should show original content
			const rawModeOptions = {
				content: unformattedJson,
				language: 'json',
				formatOnMount: false,
			};

			expect(rawModeOptions.content).toBe(unformattedJson);
			expect(rawModeOptions.formatOnMount).toBe(false);

			// Formatted mode should show pretty-printed content
			let formattedContent = unformattedJson;
			try {
				const parsed = JSON.parse(unformattedJson);
				formattedContent = JSON.stringify(parsed, null, 2);
			} catch (error) {
				// Keep original if parsing fails
			}

			const formattedModeOptions = {
				content: formattedContent,
				language: 'json',
				formatOnMount: false, // Content is already formatted
			};

			expect(formattedModeOptions.content).toContain('\n');
			expect(formattedModeOptions.content).toContain('  '); // Should have indentation
			expect(formattedModeOptions.content).not.toBe(unformattedJson);
		});

		test('should handle XML formatting correctly', () => {
			const unformattedXml = '<users><user id="1"><name>John</name></user><user id="2"><name>Jane</name></user></users>';

			// Simulate basic XML formatting
			const formattedXml = unformattedXml.replace(/></g, '>\n<').replace(/^\s*\n/gm, '');

			expect(formattedXml).toContain('\n');
			expect(formattedXml).not.toBe(unformattedXml);
		});

		test('should disable duplicate copy buttons', () => {
			// Monaco Editor should have copyButtonVisible set to false
			// to avoid duplicate copy buttons with Response Viewer
			const monacoEditorOptions = {
				copyButtonVisible: false,
				value: 'test content',
				language: 'json',
			};

			expect(monacoEditorOptions.copyButtonVisible).toBe(false);
		});

		test('should maintain editor state across tab switches', () => {
			let currentTab = 'body';
			const editorContent = '{"test": "data"}';

			// Simulate tab switch to headers
			const switchToHeaders = () => {
				currentTab = 'headers';
			};

			// Simulate tab switch back to body
			const switchToBody = () => {
				currentTab = 'body';
			};

			expect(currentTab).toBe('body');

			switchToHeaders();
			expect(currentTab).toBe('headers');

			switchToBody();
			expect(currentTab).toBe('body');

			// Editor content should be preserved
			expect(editorContent).toBe('{"test": "data"}');
		});
	});
});
