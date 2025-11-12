/**
 * Comprehensive MonacoEditor Component Tests
 * Tests actual Monaco Editor integration, user interactions, and functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MonacoEditor } from '../components/editor/monaco-editor';

// Mock Monaco Editor since it's complex to set up in test environment
const mockEditor = {
	dispose: jest.fn(),
	setValue: jest.fn(),
	getValue: jest.fn(() => 'mock content'),
	getModel: jest.fn(() => ({
		dispose: jest.fn(),
	})),
	updateOptions: jest.fn(),
	layout: jest.fn(),
	focus: jest.fn(),
};

const mockMonaco = {
	editor: {
		create: jest.fn(() => mockEditor),
		defineTheme: jest.fn(),
		setTheme: jest.fn(),
		getModels: jest.fn(() => []),
		createModel: jest.fn(() => ({
			dispose: jest.fn(),
		})),
	},
	languages: {
		json: {
			jsonDefaults: {
				setDiagnosticsOptions: jest.fn(),
			},
		},
	},
};

// Mock the monaco-editor module
jest.mock('monaco-editor', () => mockMonaco, { virtual: true });

// Mock navigator.clipboard
Object.assign(navigator, {
	clipboard: {
		writeText: jest.fn(() => Promise.resolve()),
	},
});

describe('MonacoEditor Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockEditor.dispose.mockClear();
		mockEditor.setValue.mockClear();
		mockEditor.getValue.mockClear();
		mockEditor.updateOptions.mockClear();
		mockMonaco.editor.create.mockClear();
	});

	describe('Component Rendering', () => {
		test('should render editor container', () => {
			render(<MonacoEditor value='test content' language='json' />);

			const container = screen.getByTestId('monaco-editor-container');
			expect(container).toBeInTheDocument();
		});

		test('should render copy button when copyButtonVisible is true', () => {
			render(<MonacoEditor value='test content' language='json' copyButtonVisible={true} />);

			const copyButton = screen.getByRole('button', { name: /copy/i });
			expect(copyButton).toBeInTheDocument();
		});

		test('should not render copy button when copyButtonVisible is false', () => {
			render(<MonacoEditor value='test content' language='json' copyButtonVisible={false} />);

			const copyButton = screen.queryByRole('button', { name: /copy/i });
			expect(copyButton).not.toBeInTheDocument();
		});

		test('should render copy button by default', () => {
			render(<MonacoEditor value='test content' language='json' />);

			const copyButton = screen.getByRole('button', { name: /copy/i });
			expect(copyButton).toBeInTheDocument();
		});
	});

	describe('Monaco Editor Initialization', () => {
		test('should create Monaco editor with correct options', async () => {
			render(<MonacoEditor value='test content' language='json' height='400px' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						value: 'test content',
						language: 'json',
						readOnly: true,
						minimap: { enabled: false },
						scrollBeyondLastLine: false,
						automaticLayout: true,
						fontSize: 14,
						lineNumbers: 'on',
						renderWhitespace: 'selection',
						wordWrap: 'off',
					})
				);
			});
		});

		test('should enable word wrap when wordWrap prop is true', async () => {
			render(<MonacoEditor value='test content' language='json' wordWrap={true} />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						wordWrap: 'on',
					})
				);
			});
		});

		test('should disable word wrap when wordWrap prop is false', async () => {
			render(<MonacoEditor value='test content' language='json' wordWrap={false} />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						wordWrap: 'off',
					})
				);
			});
		});

		test('should set custom height', () => {
			const { container } = render(<MonacoEditor value='test content' language='json' height='500px' />);

			const editorContainer = container.querySelector('[style*="height"]');
			expect(editorContainer).toHaveStyle({ height: '500px' });
		});
	});

	describe('Content Management', () => {
		test('should update editor content when value prop changes', async () => {
			const { rerender } = render(<MonacoEditor value='initial content' language='json' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalled();
			});

			rerender(<MonacoEditor value='updated content' language='json' />);

			await waitFor(() => {
				expect(mockEditor.setValue).toHaveBeenCalledWith('updated content');
			});
		});

		test('should update editor language when language prop changes', async () => {
			const { rerender } = render(<MonacoEditor value='test content' language='json' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalled();
			});

			rerender(<MonacoEditor value='test content' language='xml' />);

			// Language change would trigger model recreation in real Monaco
			await waitFor(() => {
				expect(mockMonaco.editor.createModel).toHaveBeenCalled();
			});
		});

		test('should format content on mount when formatOnMount is true', async () => {
			const jsonContent = '{"name":"John","age":30}';
			render(<MonacoEditor value={jsonContent} language='json' formatOnMount={true} />);

			await waitFor(() => {
				expect(mockEditor.setValue).toHaveBeenCalledWith(
					expect.stringContaining('\n') // Should contain newlines for formatting
				);
			});
		});

		test('should not format content on mount when formatOnMount is false', async () => {
			const jsonContent = '{"name":"John","age":30}';
			render(<MonacoEditor value={jsonContent} language='json' formatOnMount={false} />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						value: jsonContent, // Should be exact original content
					})
				);
			});
		});
	});

	describe('Copy Functionality', () => {
		test('should copy content to clipboard when copy button clicked', async () => {
			mockEditor.getValue.mockReturnValue('content to copy');
			render(<MonacoEditor value='content to copy' language='json' copyButtonVisible={true} />);

			const copyButton = screen.getByRole('button', { name: /copy/i });
			await userEvent.click(copyButton);

			expect(navigator.clipboard.writeText).toHaveBeenCalledWith('content to copy');
		});

		test('should show copy success feedback', async () => {
			mockEditor.getValue.mockReturnValue('content to copy');
			render(<MonacoEditor value='content to copy' language='json' copyButtonVisible={true} />);

			const copyButton = screen.getByRole('button', { name: /copy/i });
			await userEvent.click(copyButton);

			// Should show "Copied!" text temporarily
			expect(screen.getByText('Copied!')).toBeInTheDocument();

			// Should revert back to "Copy" after timeout
			await waitFor(
				() => {
					expect(screen.getByText('Copy')).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		});

		test('should handle clipboard copy errors gracefully', async () => {
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			navigator.clipboard.writeText = jest.fn(() => Promise.reject(new Error('Clipboard error')));

			mockEditor.getValue.mockReturnValue('content to copy');
			render(<MonacoEditor value='content to copy' language='json' copyButtonVisible={true} />);

			const copyButton = screen.getByRole('button', { name: /copy/i });
			await userEvent.click(copyButton);

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith('Failed to copy content:', expect.any(Error));
			});

			consoleSpy.mockRestore();
		});
	});

	describe('Language Support', () => {
		test('should handle JSON language', async () => {
			render(<MonacoEditor value='{"test": true}' language='json' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						language: 'json',
					})
				);
			});
		});

		test('should handle XML language', async () => {
			render(<MonacoEditor value='<root><test>value</test></root>' language='xml' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						language: 'xml',
					})
				);
			});
		});

		test('should handle HTML language', async () => {
			render(<MonacoEditor value='<html><body>test</body></html>' language='html' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						language: 'html',
					})
				);
			});
		});

		test('should handle CSS language', async () => {
			render(<MonacoEditor value='body { margin: 0; }' language='css' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						language: 'css',
					})
				);
			});
		});

		test('should handle JavaScript language', async () => {
			render(<MonacoEditor value='function test() { return true; }' language='javascript' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						language: 'javascript',
					})
				);
			});
		});

		test('should handle plaintext language', async () => {
			render(<MonacoEditor value='plain text content' language='plaintext' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						language: 'plaintext',
					})
				);
			});
		});
	});

	describe('Component Lifecycle', () => {
		test('should dispose editor on unmount', async () => {
			const { unmount } = render(<MonacoEditor value='test content' language='json' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalled();
			});

			unmount();

			expect(mockEditor.dispose).toHaveBeenCalled();
		});

		test('should handle resize when layout is called', async () => {
			render(<MonacoEditor value='test content' language='json' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalled();
			});

			// Simulate window resize
			fireEvent(window, new Event('resize'));

			await waitFor(() => {
				expect(mockEditor.layout).toHaveBeenCalled();
			});
		});
	});

	describe('Error Handling', () => {
		test('should handle Monaco editor creation failure', async () => {
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			mockMonaco.editor.create.mockImplementation(() => {
				throw new Error('Monaco creation failed');
			});

			render(<MonacoEditor value='test content' language='json' />);

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith('Monaco Editor initialization failed:', expect.any(Error));
			});

			consoleSpy.mockRestore();
		});

		test('should handle empty or null content', async () => {
			render(<MonacoEditor value='' language='json' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledWith(
					expect.any(Element),
					expect.objectContaining({
						value: '',
					})
				);
			});
		});
	});

	describe('Accessibility', () => {
		test('should have proper ARIA labels', () => {
			render(<MonacoEditor value='test content' language='json' />);

			const container = screen.getByTestId('monaco-editor-container');
			expect(container).toHaveAttribute('role', 'textbox');
			expect(container).toHaveAttribute('aria-label', expect.stringContaining('code editor'));
		});

		test('should be keyboard accessible', () => {
			render(<MonacoEditor value='test content' language='json' copyButtonVisible={true} />);

			const copyButton = screen.getByRole('button', { name: /copy/i });
			expect(copyButton).toHaveAttribute('tabIndex', '0');
		});
	});

	describe('Performance', () => {
		test('should not recreate editor unnecessarily', async () => {
			const { rerender } = render(<MonacoEditor value='test content' language='json' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalledTimes(1);
			});

			// Rerender with same props
			rerender(<MonacoEditor value='test content' language='json' />);

			// Should not create new editor
			expect(mockMonaco.editor.create).toHaveBeenCalledTimes(1);
		});

		test('should dispose old model when language changes', async () => {
			const mockModel = { dispose: jest.fn() };
			mockEditor.getModel.mockReturnValue(mockModel);

			const { rerender } = render(<MonacoEditor value='test content' language='json' />);

			await waitFor(() => {
				expect(mockMonaco.editor.create).toHaveBeenCalled();
			});

			rerender(<MonacoEditor value='test content' language='xml' />);

			await waitFor(() => {
				expect(mockModel.dispose).toHaveBeenCalled();
			});
		});
	});
});
