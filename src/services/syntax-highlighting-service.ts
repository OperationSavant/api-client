/**
 * Syntax Highlighting Service for VS Code API Client
 * Provides language detection and Monaco Editor integration
 */

export interface LanguageInfo {
	language: string;
	displayName: string;
	fileExtension: string;
	mimeTypes: string[];
}

export interface HighlightingOptions {
	theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
	wordWrap?: boolean;
	readOnly?: boolean;
	fontSize?: number;
	tabSize?: number;
}

/**
 * Language configurations with MIME type mappings
 */
const LANGUAGE_CONFIGS: LanguageInfo[] = [
	{
		language: 'json',
		displayName: 'JSON',
		fileExtension: '.json',
		mimeTypes: ['application/json', 'application/ld+json', 'application/hal+json', 'application/vnd.api+json', 'text/json'],
	},
	{
		language: 'xml',
		displayName: 'XML',
		fileExtension: '.xml',
		mimeTypes: ['application/xml', 'text/xml', 'application/soap+xml', 'application/xhtml+xml', 'application/atom+xml', 'application/rss+xml'],
	},
	{
		language: 'html',
		displayName: 'HTML',
		fileExtension: '.html',
		mimeTypes: ['text/html', 'application/xhtml+xml'],
	},
	{
		language: 'javascript',
		displayName: 'JavaScript',
		fileExtension: '.js',
		mimeTypes: ['application/javascript', 'application/x-javascript', 'text/javascript'],
	},
	{
		language: 'typescript',
		displayName: 'TypeScript',
		fileExtension: '.ts',
		mimeTypes: ['application/typescript', 'text/typescript'],
	},
	{
		language: 'css',
		displayName: 'CSS',
		fileExtension: '.css',
		mimeTypes: ['text/css'],
	},
	{
		language: 'yaml',
		displayName: 'YAML',
		fileExtension: '.yml',
		mimeTypes: ['application/yaml', 'application/x-yaml', 'text/yaml', 'text/x-yaml'],
	},
	{
		language: 'sql',
		displayName: 'SQL',
		fileExtension: '.sql',
		mimeTypes: ['application/sql', 'text/sql'],
	},
	{
		language: 'markdown',
		displayName: 'Markdown',
		fileExtension: '.md',
		mimeTypes: ['text/markdown', 'text/x-markdown'],
	},
	{
		language: 'plaintext',
		displayName: 'Plain Text',
		fileExtension: '.txt',
		mimeTypes: ['text/plain', 'text/txt', 'application/octet-stream'],
	},
];

/**
 * Default highlighting options
 */
const DEFAULT_OPTIONS: HighlightingOptions = {
	theme: 'vs-dark',
	wordWrap: false,
	readOnly: true,
	fontSize: 14,
	tabSize: 2,
};

export class SyntaxHighlightingService {
	private static instance: SyntaxHighlightingService;
	private languageConfigs: LanguageInfo[];
	private vsCodeTheme: string | null = null;

	private constructor() {
		this.languageConfigs = LANGUAGE_CONFIGS;
		this.initializeVSCodeTheme();
	}

	/**
	 * Get singleton instance
	 */
	public static getInstance(): SyntaxHighlightingService {
		if (!SyntaxHighlightingService.instance) {
			SyntaxHighlightingService.instance = new SyntaxHighlightingService();
		}
		return SyntaxHighlightingService.instance;
	}

	/**
	 * Initialize VS Code theme integration
	 */
	private initializeVSCodeTheme(): void {
		// In VS Code extension context, we can access the current theme
		// This would be integrated with VS Code's theme API
		try {
			// @ts-ignore - VS Code API integration
			if (typeof vscode !== 'undefined') {
				// Get current VS Code theme
				this.vsCodeTheme = 'vs-dark'; // Default fallback
			}
		} catch (error) {
			console.warn('VS Code theme integration not available:', error);
		}
	}

	/**
	 * Detect language from Content-Type header
	 */
	public detectLanguageFromContentType(contentType: string): LanguageInfo {
		if (!contentType) {
			return this.getLanguageConfig('plaintext');
		}

		// Normalize content type (remove charset, boundary, etc.)
		const normalizedContentType = contentType.toLowerCase().split(';')[0].trim();

		// Find matching language configuration
		const languageConfig = this.languageConfigs.find(config => config.mimeTypes.some(mimeType => normalizedContentType.includes(mimeType.toLowerCase())));

		return languageConfig || this.getLanguageConfig('plaintext');
	}

	/**
	 * Detect language from file extension
	 */
	public detectLanguageFromExtension(filename: string): LanguageInfo {
		if (!filename) {
			return this.getLanguageConfig('plaintext');
		}

		const extension = filename.toLowerCase().split('.').pop() || '';

		const languageConfig = this.languageConfigs.find(config => config.fileExtension.toLowerCase() === `.${extension}`);

		return languageConfig || this.getLanguageConfig('plaintext');
	}

	/**
	 * Detect language from response content
	 */
	public detectLanguageFromContent(content: string): LanguageInfo {
		if (!content || typeof content !== 'string') {
			return this.getLanguageConfig('plaintext');
		}

		const trimmedContent = content.trim();

		// JSON detection
		if (this.isJsonContent(trimmedContent)) {
			return this.getLanguageConfig('json');
		}

		// XML/HTML detection
		if (this.isXmlContent(trimmedContent)) {
			if (this.isHtmlContent(trimmedContent)) {
				return this.getLanguageConfig('html');
			}
			return this.getLanguageConfig('xml');
		}

		// JavaScript detection
		if (this.isJavaScriptContent(trimmedContent)) {
			return this.getLanguageConfig('javascript');
		}

		// CSS detection
		if (this.isCssContent(trimmedContent)) {
			return this.getLanguageConfig('css');
		}

		// SQL detection
		if (this.isSqlContent(trimmedContent)) {
			return this.getLanguageConfig('sql');
		}

		return this.getLanguageConfig('plaintext');
	}

	/**
	 * Get language configuration by language ID
	 */
	public getLanguageConfig(languageId: string): LanguageInfo {
		const config = this.languageConfigs.find(config => config.language === languageId);
		return config || this.languageConfigs[this.languageConfigs.length - 1]; // fallback to plaintext
	}

	/**
	 * Get all supported languages
	 */
	public getSupportedLanguages(): LanguageInfo[] {
		return [...this.languageConfigs];
	}

	/**
	 * Get Monaco Editor options with VS Code theme integration
	 */
	public getMonacoOptions(customOptions: Partial<HighlightingOptions> = {}): HighlightingOptions {
		const baseOptions = { ...DEFAULT_OPTIONS, ...customOptions };

		// Use VS Code theme if available
		if (this.vsCodeTheme) {
			baseOptions.theme = this.vsCodeTheme as any;
		}

		return baseOptions;
	}

	/**
	 * Format content based on language
	 */
	public formatContent(content: string, language: string): string {
		try {
			switch (language) {
				case 'json':
					return JSON.stringify(JSON.parse(content), null, 2);
				case 'xml':
				case 'html':
					return this.formatXml(content);
				default:
					return content;
			}
		} catch (error) {
			console.warn(`Failed to format ${language} content:`, error);
			return content;
		}
	}

	/**
	 * Validate content syntax
	 */
	public validateSyntax(content: string, language: string): { isValid: boolean; error?: string } {
		try {
			switch (language) {
				case 'json':
					JSON.parse(content);
					return { isValid: true };
				case 'xml':
				case 'html':
					// Basic XML validation - in real implementation, use DOMParser
					if (content.trim().startsWith('<') && content.trim().endsWith('>')) {
						return { isValid: true };
					}
					return { isValid: false, error: 'Invalid XML structure' };
				default:
					return { isValid: true };
			}
		} catch (error) {
			return { isValid: false, error: error instanceof Error ? error.message : 'Syntax error' };
		}
	}

	// Private helper methods for content detection

	private isJsonContent(content: string): boolean {
		try {
			JSON.parse(content);
			return true;
		} catch {
			return false;
		}
	}

	private isXmlContent(content: string): boolean {
		return content.startsWith('<?xml') || (content.startsWith('<') && content.includes('</') && content.endsWith('>'));
	}

	private isHtmlContent(content: string): boolean {
		const htmlTags = ['<!doctype html', '<html', '<head', '<body', '<div', '<span'];
		const lowerContent = content.toLowerCase();
		return htmlTags.some(tag => lowerContent.includes(tag));
	}

	private isJavaScriptContent(content: string): boolean {
		const jsKeywords = ['function', 'var', 'let', 'const', 'class', 'import', 'export'];
		return jsKeywords.some(keyword => content.includes(keyword));
	}

	private isCssContent(content: string): boolean {
		return /[a-zA-Z-]+\s*:\s*[^;]+;/.test(content) || content.includes('@media') || content.includes('@import');
	}

	private isSqlContent(content: string): boolean {
		const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
		const upperContent = content.toUpperCase();
		return sqlKeywords.some(keyword => upperContent.includes(keyword));
	}

	private formatXml(xml: string): string {
		// Basic XML formatting - in real implementation, use a proper XML formatter
		let formatted = '';
		let indent = 0;
		const tab = '  ';

		xml.split(/</).forEach((node, index) => {
			if (index === 0) {
				formatted += node;
				return;
			}

			if (node.startsWith('/')) {
				indent--;
			}

			formatted += '\n' + tab.repeat(indent) + '<' + node;

			if (!node.startsWith('/') && !node.endsWith('/>')) {
				indent++;
			}
		});

		return formatted;
	}
}

// Export singleton instance
export const syntaxHighlightingService = SyntaxHighlightingService.getInstance();
