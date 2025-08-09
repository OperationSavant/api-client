/**
 * Test Suite for App Component
 * Tests the main webview App component functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import App from '../webview/App';

// Mock vscode API
const mockVscodeApi = {
	postMessage: jest.fn(),
};

// Mock acquireVsCodeApi
(global as any).acquireVsCodeApi = jest.fn(() => mockVscodeApi);

// Mock navigator.clipboard
Object.assign(navigator, {
	clipboard: {
		writeText: jest.fn(() => Promise.resolve()),
	},
});

// Mock window.addEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
	Card: ({ children, className }: any) => (
		<div className={className} data-testid='card'>
			{children}
		</div>
	),
	CardContent: ({ children, className }: any) => (
		<div className={className} data-testid='card-content'>
			{children}
		</div>
	),
	CardHeader: ({ children, className }: any) => (
		<div className={className} data-testid='card-header'>
			{children}
		</div>
	),
	CardTitle: ({ children }: any) => <h2 data-testid='card-title'>{children}</h2>,
}));

jest.mock('@/components/ui/button', () => ({
	Button: ({ children, onClick, disabled, className }: any) => (
		<button onClick={onClick} disabled={disabled} className={className} data-testid='button'>
			{children}
		</button>
	),
}));

jest.mock('@/components/ui/input', () => ({
	Input: ({ value, onChange, placeholder, onBlur, className }: any) => (
		<input value={value} onChange={onChange} placeholder={placeholder} onBlur={onBlur} className={className} data-testid='url-input' />
	),
}));

jest.mock('@/components/ui/select', () => ({
	Select: ({ children, onValueChange, defaultValue }: any) => (
		<select onChange={e => onValueChange?.(e.target.value)} defaultValue={defaultValue} data-testid='method-select'>
			{children}
		</select>
	),
	SelectContent: ({ children }: any) => <div data-testid='select-content'>{children}</div>,
	SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
	SelectTrigger: ({ children }: any) => <div data-testid='select-trigger'>{children}</div>,
	SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock('@/components/ui/tabs', () => ({
	Tabs: ({ children, defaultValue }: any) => (
		<div data-testid='tabs' data-default={defaultValue}>
			{children}
		</div>
	),
	TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>,
	TabsList: ({ children }: any) => <div data-testid='tabs-list'>{children}</div>,
	TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-${value}`}>{children}</button>,
}));

// Mock the request tabs components
jest.mock('@/components/request-tabs/ParamsTab', () => {
	return function ParamsTab() {
		return <div data-testid='params-tab'>Params Tab</div>;
	};
});

jest.mock('@/components/request-tabs/HeadersTab', () => {
	return function HeadersTab() {
		return <div data-testid='headers-tab'>Headers Tab</div>;
	};
});

jest.mock('@/components/request-tabs/AuthTab', () => {
	return function AuthTab() {
		return <div data-testid='auth-tab'>Auth Tab</div>;
	};
});

jest.mock('@/components/request-tabs/BodyTab', () => {
	return function BodyTab() {
		return <div data-testid='body-tab'>Body Tab</div>;
	};
});

jest.mock('@/components/request-tabs/PreRequestScriptTab', () => {
	return function PreRequestScriptTab() {
		return <div data-testid='pre-request-tab'>Pre-request Script Tab</div>;
	};
});

jest.mock('@/components/request-tabs/TestsTab', () => {
	return function TestsTab() {
		return <div data-testid='tests-tab'>Tests Tab</div>;
	};
});

jest.mock('@/components/request-tabs/SettingsTab', () => {
	return function SettingsTab() {
		return <div data-testid='settings-tab'>Settings Tab</div>;
	};
});

// Mock the curl import/export component
jest.mock('@/components/curl-import-export', () => ({
	CurlImportExport: () => <div data-testid='curl-tab'>cURL Import/Export</div>,
}));

// Mock the response viewer
jest.mock('@/components/response/response-viewer', () => ({
	ResponseViewer: ({ response, isLoading }: any) => <div data-testid='response-viewer'>{isLoading ? 'Loading...' : 'Response Viewer'}</div>,
}));

// Mock the cookie manager
jest.mock('@/components/cookie/cookie-manager', () => ({
	CookieManager: () => <div data-testid='cookie-manager'>Cookie Manager</div>,
}));

// Mock the services
jest.mock('@/services/cookie-integration', () => ({
	CookieIntegration: jest.fn().mockImplementation(() => ({
		processRequest: jest.fn(req => req),
		processResponse: jest.fn(),
	})),
}));

jest.mock('@/services/cookie-service', () => ({
	cookieService: {
		addCookie: jest.fn(),
		getAllCookies: jest.fn(() => []),
		clearAll: jest.fn(),
		exportCookies: jest.fn(() => '[]'),
	},
}));

describe('App Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockVscodeApi.postMessage.mockClear();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	test('renders without crashing', () => {
		render(<App />);
		expect(screen.getByText('API Request')).toBeTruthy();
		expect(screen.getByText('API Response')).toBeTruthy();
	});

	test('renders main request and response sections', () => {
		render(<App />);

		// Check for main card titles
		const cardTitles = screen.getAllByTestId('card-title');
		const titleTexts = cardTitles.map(title => title.textContent);
		expect(titleTexts).toContain('API Request');
		expect(titleTexts).toContain('API Response');
	});

	test('renders all request tabs', () => {
		render(<App />);

		expect(screen.getByTestId('tab-params')).toBeTruthy();
		expect(screen.getByTestId('tab-headers')).toBeTruthy();
		expect(screen.getByTestId('tab-auth')).toBeTruthy();
		expect(screen.getByTestId('tab-body')).toBeTruthy();
		expect(screen.getByTestId('tab-cookies')).toBeTruthy();
		expect(screen.getByTestId('tab-curl')).toBeTruthy();
		expect(screen.getByTestId('tab-pre-request')).toBeTruthy();
		expect(screen.getByTestId('tab-tests')).toBeTruthy();
		expect(screen.getByTestId('tab-settings')).toBeTruthy();
	});

	test('renders send button', () => {
		render(<App />);
		const sendButton = screen.getByRole('button', { name: /send/i });
		expect(sendButton).toBeTruthy();
	});

	test('renders URL input with default value', () => {
		render(<App />);
		const urlInput = screen.getByTestId('url-input');
		expect(urlInput).toBeTruthy();
		expect((urlInput as HTMLInputElement).value).toBe('api.example.com/data');
	});

	test('renders method selector', () => {
		render(<App />);
		const methodSelects = screen.getAllByTestId('method-select');
		expect(methodSelects.length).toBeGreaterThan(0);
		expect(methodSelects[0]).toBeTruthy(); // HTTP method selector
		expect(methodSelects[1]).toBeTruthy(); // Protocol selector
	});

	test('sends request when send button is clicked', () => {
		render(<App />);
		const sendButton = screen.getByRole('button', { name: /send/i });

		fireEvent.click(sendButton);

		expect(mockVscodeApi.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				command: 'sendRequest',
				url: 'https://api.example.com/data',
				method: 'GET',
			})
		);
	});

	test('displays placeholder when no response data', () => {
		render(<App />);

		expect(screen.getByText('Send a request to see the response.')).toBeTruthy();
	});

	test('renders cookie manager in cookies tab', () => {
		render(<App />);

		expect(screen.getByTestId('cookie-manager')).toBeTruthy();
	});

	test('handles URL input changes', () => {
		render(<App />);
		const urlInput = screen.getByTestId('url-input');

		fireEvent.change(urlInput, { target: { value: 'example.com/api' } });

		expect((urlInput as HTMLInputElement).value).toBe('example.com/api');
	});

	test('sets up message event listener on mount', () => {
		render(<App />);

		expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function));
	});

	test('cleans up message event listener on unmount', () => {
		const { unmount } = render(<App />);

		unmount();

		expect(mockRemoveEventListener).toHaveBeenCalledWith('message', expect.any(Function));
	});

	test('processes API response messages', () => {
		render(<App />);

		// Get the message handler that was registered
		const messageCall = mockAddEventListener.mock.calls.find((call: any) => call[0] === 'message');
		expect(messageCall).toBeTruthy();

		const messageHandler = messageCall![1] as Function;

		// Simulate receiving an API response
		const mockResponse = {
			data: {
				command: 'apiResponse',
				data: {
					status: 200,
					statusText: 'OK',
					headers: { 'content-type': 'application/json' },
					body: '{"success": true}',
					responseTime: 123,
				},
			},
		};

		expect(() => messageHandler(mockResponse)).not.toThrow();
	});

	test('handles loadRequest messages', () => {
		render(<App />);

		const messageCall = mockAddEventListener.mock.calls.find((call: any) => call[0] === 'message');
		const messageHandler = messageCall![1] as Function;

		// Simulate receiving a load request message
		const mockLoadRequest = {
			data: {
				command: 'loadRequest',
				data: {
					method: 'POST',
					url: 'test.com/api',
					headers: { Authorization: 'Bearer token' },
					body: '{"test": true}',
				},
			},
		};

		expect(() => messageHandler(mockLoadRequest)).not.toThrow();
	});
});

describe('App State Management', () => {
	test('initializes with correct default state', () => {
		render(<App />);

		// Verify default URL
		const urlInput = screen.getByTestId('url-input');
		expect((urlInput as HTMLInputElement).value).toBe('api.example.com/data');

		// Verify default response state
		expect(screen.getByText('Send a request to see the response.')).toBeTruthy();
	});

	test('updates state when URL is modified', () => {
		render(<App />);
		const urlInput = screen.getByTestId('url-input');

		fireEvent.change(urlInput, { target: { value: 'newapi.com' } });

		expect((urlInput as HTMLInputElement).value).toBe('newapi.com');
	});
});

describe('App Error Handling', () => {
	test('handles malformed response messages gracefully', () => {
		render(<App />);

		const messageCall = mockAddEventListener.mock.calls.find((call: any) => call[0] === 'message');
		const messageHandler = messageCall![1] as Function;

		// Simulate malformed message with missing required properties
		const malformedMessage = {
			data: {
				command: 'apiResponse',
				data: null, // Invalid data structure
			},
		};

		// Should handle gracefully and not crash
		expect(() => messageHandler(malformedMessage)).not.toThrow();
	});

	test('handles unknown message commands gracefully', () => {
		render(<App />);

		const messageCall = mockAddEventListener.mock.calls.find((call: any) => call[0] === 'message');
		const messageHandler = messageCall![1] as Function;

		const unknownMessage = {
			data: {
				command: 'unknownCommand',
				data: {},
			},
		};

		expect(() => messageHandler(unknownMessage)).not.toThrow();
	});

	test('component handles errors during rendering gracefully', () => {
		// Test that component doesn't crash with missing props or state
		expect(() => render(<App />)).not.toThrow();
	});
});
