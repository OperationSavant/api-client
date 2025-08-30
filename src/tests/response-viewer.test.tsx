/**
 * Comprehensive ResponseViewer Component Tests
 * Tests actual UI rendering, user interactions, and component behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ResponseViewer, ResponseData } from '../components/response/response-viewer';

// Mock Monaco Editor to avoid complex setup in tests
jest.mock('../components/editor/monaco-editor', () => ({
	MonacoEditor: ({ value, language }: { value: string; language: string }) => (
		<div data-testid='monaco-editor' data-language={language} data-value={value}>
			{value}
		</div>
	),
}));

describe('ResponseViewer Component', () => {
	const mockJsonResponse: ResponseData = {
		status: 200,
		statusText: 'OK',
		headers: { 'Content-Type': 'application/json' },
		body: '{"name":"John","age":30,"city":"NYC"}',
		contentType: 'application/json',
		size: 1024,
		duration: 250,
		isError: false,
	};

	const mockXmlResponse: ResponseData = {
		status: 200,
		statusText: 'OK',
		headers: { 'Content-Type': 'application/xml' },
		body: '<root><user><name>John</name><age>30</age></user></root>',
		contentType: 'application/xml',
		size: 2048,
		duration: 150,
		isError: false,
	};

	const mockErrorResponse: ResponseData = {
		status: 500,
		statusText: 'Internal Server Error',
		headers: { 'Content-Type': 'application/json' },
		body: '{"error":"Server error"}',
		contentType: 'application/json',
		size: 512,
		duration: 1000,
		isError: true,
		error: 'Internal Server Error',
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Component Rendering', () => {
		test('should render empty state when no response provided', () => {
			render(<ResponseViewer response={null} isLoading={false} />);

			expect(screen.getByText('Send a request to see the response')).toBeInTheDocument();
			expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument();
		});

		test('should render loading state when isLoading is true', () => {
			render(<ResponseViewer response={null} isLoading={true} />);

			expect(screen.getByText('Loading response...')).toBeInTheDocument();
			expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
		});

		test('should render error state when response has error', () => {
			render(<ResponseViewer response={mockErrorResponse} isLoading={false} />);

			expect(screen.getByText('Request Failed')).toBeInTheDocument();
			expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
		});

		test('should render response metrics for successful response', () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			expect(screen.getByText('Status:')).toBeInTheDocument();
			expect(screen.getByText('200 OK')).toBeInTheDocument();
			expect(screen.getByText('Time:')).toBeInTheDocument();
			expect(screen.getByText('250 ms')).toBeInTheDocument();
			expect(screen.getByText('Size:')).toBeInTheDocument();
			expect(screen.getByText('1 KB')).toBeInTheDocument();
		});
	});

	describe('UI Controls', () => {
		test('should render all control buttons', () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			expect(screen.getByTestId('copy-button')).toBeInTheDocument();
			expect(screen.getByTestId('download-button')).toBeInTheDocument();
			expect(screen.getByTestId('fullscreen-button')).toBeInTheDocument();
		});
		test('should render word wrap toggle', () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			expect(screen.getByRole('switch', { name: /word wrap/i })).toBeInTheDocument();
			expect(screen.getByLabelText(/word wrap/i)).toBeInTheDocument();
		});

		test('should disable buttons when no response body', () => {
			const emptyResponse = { ...mockJsonResponse, body: '' };
			render(<ResponseViewer response={emptyResponse} isLoading={false} />);

			expect(screen.getByRole('button', { name: /copy/i })).toBeDisabled();
			expect(screen.getByRole('button', { name: /download/i })).toBeDisabled();
		});

		test('should call onCopy when copy button clicked', async () => {
			const mockOnCopy = jest.fn();
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} onCopy={mockOnCopy} />);

			const copyButton = screen.getByRole('button', { name: /copy/i });
			await userEvent.click(copyButton);

			expect(mockOnCopy).toHaveBeenCalledWith(mockJsonResponse.body);
		});

		test('should call onDownload when download button clicked', async () => {
			const mockOnDownload = jest.fn();
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} onDownload={mockOnDownload} />);

			const downloadButton = screen.getByRole('button', { name: /download/i });
			await userEvent.click(downloadButton);

			expect(mockOnDownload).toHaveBeenCalledWith('json');
		});
	});

	describe('Raw vs Formatted Tabs', () => {
		test('should render both Raw and Formatted tabs', () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			expect(screen.getByRole('tab', { name: /formatted/i })).toBeInTheDocument();
			expect(screen.getByRole('tab', { name: /raw/i })).toBeInTheDocument();
		});

		test('should default to Formatted tab', () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			const formattedTab = screen.getByRole('tab', { name: /formatted/i });
			expect(formattedTab).toHaveAttribute('data-state', 'active');
		});

		test('should switch to Raw tab when clicked', async () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			const rawTab = screen.getByRole('tab', { name: /raw/i });
			await userEvent.click(rawTab);

			expect(rawTab).toHaveAttribute('data-state', 'active');
		});

		test('should show different content in Raw vs Formatted tabs for JSON', async () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			// Check formatted content (should be pretty-printed)
			const formattedEditor = screen.getByTestId('monaco-editor');
			expect(formattedEditor).toHaveAttribute('data-language', 'json');
			const formattedContent = formattedEditor.getAttribute('data-value');
			expect(formattedContent).toContain('\n'); // Should have newlines for formatting

			// Switch to raw tab
			const rawTab = screen.getByRole('tab', { name: /raw/i });
			await userEvent.click(rawTab);

			// Check raw content (should be exact server response)
			await waitFor(() => {
				const rawEditor = screen.getByTestId('monaco-editor');
				expect(rawEditor).toHaveAttribute('data-language', 'json');
				const rawContent = rawEditor.getAttribute('data-value');
				expect(rawContent).toBe(mockJsonResponse.body); // Exact match
			});
		});

		test('should show different content in Raw vs Formatted tabs for XML', async () => {
			render(<ResponseViewer response={mockXmlResponse} isLoading={false} />);

			// Check formatted content (should be indented)
			const formattedEditor = screen.getByTestId('monaco-editor');
			expect(formattedEditor).toHaveAttribute('data-language', 'xml');
			const formattedContent = formattedEditor.getAttribute('data-value');
			expect(formattedContent).toContain('\n'); // Should have newlines for formatting

			// Switch to raw tab
			const rawTab = screen.getByRole('tab', { name: /raw/i });
			await userEvent.click(rawTab);

			// Check raw content
			await waitFor(() => {
				const rawEditor = screen.getByTestId('monaco-editor');
				expect(rawEditor).toHaveAttribute('data-language', 'xml');
				const rawContent = rawEditor.getAttribute('data-value');
				expect(rawContent).toBe(mockXmlResponse.body); // Exact match
			});
		});
	});

	describe('Content Type Detection', () => {
		test('should detect JSON content type and set correct language', () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			const editor = screen.getByTestId('monaco-editor');
			expect(editor).toHaveAttribute('data-language', 'json');
		});

		test('should detect XML content type and set correct language', () => {
			render(<ResponseViewer response={mockXmlResponse} isLoading={false} />);

			const editor = screen.getByTestId('monaco-editor');
			expect(editor).toHaveAttribute('data-language', 'xml');
		});

		test('should handle HTML content type', () => {
			const htmlResponse = {
				...mockJsonResponse,
				contentType: 'text/html',
				body: '<html><body><h1>Hello</h1></body></html>',
			};
			render(<ResponseViewer response={htmlResponse} isLoading={false} />);

			const editor = screen.getByTestId('monaco-editor');
			expect(editor).toHaveAttribute('data-language', 'html');
		});

		test('should handle CSS content type', () => {
			const cssResponse = {
				...mockJsonResponse,
				contentType: 'text/css',
				body: 'body { margin: 0; padding: 0; }',
			};
			render(<ResponseViewer response={cssResponse} isLoading={false} />);

			const editor = screen.getByTestId('monaco-editor');
			expect(editor).toHaveAttribute('data-language', 'css');
		});

		test('should handle JavaScript content type', () => {
			const jsResponse = {
				...mockJsonResponse,
				contentType: 'application/javascript',
				body: 'function hello() { console.log("Hello"); }',
			};
			render(<ResponseViewer response={jsResponse} isLoading={false} />);

			const editor = screen.getByTestId('monaco-editor');
			expect(editor).toHaveAttribute('data-language', 'javascript');
		});

		test('should default to plaintext for unknown content types', () => {
			const textResponse = {
				...mockJsonResponse,
				contentType: 'text/plain',
				body: 'Plain text content',
			};
			render(<ResponseViewer response={textResponse} isLoading={false} />);

			const editor = screen.getByTestId('monaco-editor');
			expect(editor).toHaveAttribute('data-language', 'plaintext');
		});
	});

	describe('Format Detection for Download', () => {
		test('should detect correct format for JSON download', async () => {
			const mockOnDownload = jest.fn();
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} onDownload={mockOnDownload} />);

			const downloadButton = screen.getByRole('button', { name: /download/i });
			await userEvent.click(downloadButton);

			expect(mockOnDownload).toHaveBeenCalledWith('json');
		});

		test('should detect correct format for XML download', async () => {
			const mockOnDownload = jest.fn();
			render(<ResponseViewer response={mockXmlResponse} isLoading={false} onDownload={mockOnDownload} />);

			const downloadButton = screen.getByRole('button', { name: /download/i });
			await userEvent.click(downloadButton);

			expect(mockOnDownload).toHaveBeenCalledWith('xml');
		});
	});

	describe('Status Color Coding', () => {
		test('should show green badge for 2xx status', () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			const statusBadge = screen.getByText('200 OK');
			expect(statusBadge).toHaveClass('bg-green-500');
		});

		test('should show red badge for 5xx status', () => {
			render(<ResponseViewer response={mockErrorResponse} isLoading={false} />);

			const statusBadge = screen.getByText('500 Internal Server Error');
			expect(statusBadge).toHaveClass('bg-red-500');
		});

		test('should show yellow badge for 3xx status', () => {
			const redirectResponse = { ...mockJsonResponse, status: 301, statusText: 'Moved Permanently' };
			render(<ResponseViewer response={redirectResponse} isLoading={false} />);

			const statusBadge = screen.getByText('301 Moved Permanently');
			expect(statusBadge).toHaveClass('bg-yellow-500');
		});

		test('should show orange badge for 4xx status', () => {
			const clientErrorResponse = { ...mockJsonResponse, status: 404, statusText: 'Not Found' };
			render(<ResponseViewer response={clientErrorResponse} isLoading={false} />);

			const statusBadge = screen.getByText('404 Not Found');
			expect(statusBadge).toHaveClass('bg-orange-500');
		});
	});

	describe('Word Wrap Functionality', () => {
		test('should toggle word wrap when switch is clicked', async () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			const wordWrapSwitch = screen.getByRole('switch', { name: /word wrap/i });
			expect(wordWrapSwitch).not.toBeChecked();

			await userEvent.click(wordWrapSwitch);
			expect(wordWrapSwitch).toBeChecked();
		});
	});

	describe('Fullscreen Functionality', () => {
		test('should toggle fullscreen when button is clicked', async () => {
			render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);

			const container = screen.getByTestId('response-viewer-container') || document.querySelector('[class*="flex flex-col h-full"]');
			expect(container).not.toHaveClass('fixed');

			// Find fullscreen button (expand icon)
			const fullscreenButton = screen.getByRole('button', { name: /expand/i }) || screen.getAllByRole('button').find(btn => btn.querySelector('svg'));

			if (fullscreenButton) {
				await userEvent.click(fullscreenButton);
				// After click, should have fullscreen classes
				expect(container).toHaveClass('fixed');
			}
		});
	});

	describe('Error Handling', () => {
		test('should handle malformed JSON gracefully in formatted mode', () => {
			const malformedJsonResponse = {
				...mockJsonResponse,
				body: '{"name": "John",}', // Invalid JSON
			};
			render(<ResponseViewer response={malformedJsonResponse} isLoading={false} />);

			// Should not crash and should show raw content
			const editor = screen.getByTestId('monaco-editor');
			expect(editor).toBeInTheDocument();
			expect(editor.getAttribute('data-value')).toBe(malformedJsonResponse.body);
		});

		test('should handle empty response body', () => {
			const emptyResponse = { ...mockJsonResponse, body: '' };
			render(<ResponseViewer response={emptyResponse} isLoading={false} />);

			expect(screen.getByRole('button', { name: /copy/i })).toBeDisabled();
			expect(screen.getByRole('button', { name: /download/i })).toBeDisabled();
		});
	});

	describe('Component Props', () => {
		test('should apply custom className', () => {
			const { container } = render(<ResponseViewer response={mockJsonResponse} isLoading={false} className='custom-class' />);

			expect(container.firstChild).toHaveClass('custom-class');
		});

		test('should handle missing optional props', () => {
			expect(() => {
				render(<ResponseViewer response={mockJsonResponse} isLoading={false} />);
			}).not.toThrow();
		});
	});
});
