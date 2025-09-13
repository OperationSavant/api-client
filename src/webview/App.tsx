import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

import ParamsTab from '@/components/request-tabs/ParamsTab';
import HeadersTab from '@/components/request-tabs/HeadersTab';
import AuthTab from '@/components/request-tabs/AuthTab';
import BodyTab from '@/components/request-tabs/BodyTab';
import PreRequestScriptTab from '@/components/request-tabs/PreRequestScriptTab';
import TestsTab from '@/components/request-tabs/TestsTab';
import SettingsTab from '@/components/request-tabs/SettingsTab';
import { CurlImportExport } from '@/components/curl-import-export';
import { TestSuite, TestExecution } from '@/types/testing';
import { AuthConfig } from '@/types/auth';
import { RequestConfig } from '@/types/request';

import { ResponseViewer, ResponseData } from '@/components/response/response-viewer';
import { CookieManager } from '@/components/cookie/cookie-manager';
import { CookieIntegration } from '@/services/cookie-integration';
import { cookieService } from '@/services/cookie-service';
import { Cookie, CookieImportExport } from '@/types/cookie';

declare const acquireVsCodeApi: () => any;

function App() {
	const vscodeApi = useRef<any>(null);
	const [url, setUrl] = useState('');
	const [method, setMethod] = useState('GET');
	const [protocol, setProtocol] = useState('https');
	const [response, setResponse] = useState('');
	const [loading, setLoading] = useState(false);
	const [headers, setHeaders] = useState<Record<string, string>>({});
	const [params, setParams] = useState<Record<string, string>>({});
	const [requestBody, setRequestBody] = useState('');
	const [auth, setAuth] = useState<AuthConfig>({ type: 'none' });
	const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
	const [testExecutions, setTestExecutions] = useState<TestExecution[]>([]);
	const [isRunningTests, setIsRunningTests] = useState(false);

	// Advanced Response Processing State
	const [responseData, setResponseData] = useState<ResponseData | null>(null);
	const [showCookieManager, setShowCookieManager] = useState(false);
	const [cookies, setCookies] = useState<Cookie[]>([]);
	const cookieIntegration = useRef(new CookieIntegration(cookieService));

	// Create current request configuration for cURL export
	const currentRequest: RequestConfig = {
		url: `${protocol}://${url}`,
		method: method as any,
		headers,
		auth,
		body: {
			type: 'raw',
			formData: [],
			urlEncoded: [],
			raw: {
				content: requestBody,
				language: 'json',
				autoFormat: true,
			},
			binary: {},
			graphql: {
				query: '',
				variables: '',
			},
		},
	};

	const handleCurlImport = (request: RequestConfig) => {
		// Extract URL parts
		if (request.url) {
			const urlObj = new URL(request.url);
			setProtocol(urlObj.protocol.replace(':', ''));
			setUrl(urlObj.host + urlObj.pathname + urlObj.search);
		}

		// Set method
		setMethod(request.method);

		// Set headers
		setHeaders(request.headers);

		// Set authentication
		setAuth(request.auth);

		// Set body content
		if (request.body.raw?.content) {
			setRequestBody(request.body.raw.content);
		}
	};

	const handleCurlCopy = (curlCommand: string) => {
		// Show success message or handle copy completion
		console.log('cURL command copied to clipboard');
	};

	const handleUrlBlur = () => {
		if (url && url.trim()) {
			const trimmedUrl = url.trim();

			// Auto-extract protocol if user enters full URL
			if (trimmedUrl.startsWith('https://')) {
				setProtocol('https');
				setUrl(trimmedUrl.replace('https://', ''));
			} else if (trimmedUrl.startsWith('http://')) {
				setProtocol('http');
				setUrl(trimmedUrl.replace('http://', ''));
			}
			// If no protocol is specified, keep the URL as is
		}
	};

	const handleContentTypeChange = (contentType: string) => {
		setHeaders(prev => ({
			...prev,
			'Content-Type': contentType,
		}));
	};

	const handleRunTests = (suiteId: string) => {
		setIsRunningTests(true);
		// Mock test execution for now
		setTimeout(() => {
			const suite = testSuites.find(s => s.id === suiteId);
			if (suite) {
				const execution: TestExecution = {
					id: Date.now().toString() + Math.random(),
					suiteId: suite.id,
					timestamp: new Date(),
					duration: Math.floor(Math.random() * 100),
					status: Math.random() > 0.2 ? 'passed' : 'failed',
					totalTests: suite.assertions.length,
					passedTests: Math.floor(suite.assertions.length * Math.random()),
					failedTests: 0,
					results: suite.assertions.map(assertion => ({
						id: Date.now().toString() + Math.random(),
						assertionId: assertion.id,
						passed: Math.random() > 0.2,
						actualValue: 'Mock actual value',
						expectedValue: assertion.expectedValue,
						message: `Test assertion for ${assertion.description || assertion.type}`,
					})),
				};
				execution.failedTests = execution.totalTests - execution.passedTests;
				setTestExecutions(prev => [...prev, execution]);
			}
			setIsRunningTests(false);
		}, 1000);
	};

	// Response Operations Handlers
	const handleResponseDownload = (format: string) => {
		if (!responseData) return;

		let content = responseData.body;
		let filename = 'response';
		let mimeType = 'text/plain';

		// Format content and set appropriate filename/mime type
		switch (format) {
			case 'json':
				try {
					content = JSON.stringify(JSON.parse(responseData.body), null, 2);
				} catch {
					content = responseData.body;
				}
				filename = 'response.json';
				mimeType = 'application/json';
				break;
			case 'xml':
				filename = 'response.xml';
				mimeType = 'application/xml';
				break;
			case 'html':
				filename = 'response.html';
				mimeType = 'text/html';
				break;
			case 'text':
				filename = 'response.txt';
				mimeType = 'text/plain';
				break;
			default:
				filename = `response.${format}`;
		}

		// Create blob and download
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleResponseCopy = (content: string) => {
		navigator.clipboard.writeText(content);
		console.log('Response copied to clipboard');
	};

	// Cookie Management Handlers
	const handleAddCookie = (cookie: Omit<Cookie, 'created' | 'lastAccessed'>) => {
		cookieService.addCookie({
			...cookie,
			created: new Date(),
			lastAccessed: new Date(),
		} as Cookie);
	};

	const handleUpdateCookie = (id: string, updates: Partial<Cookie>) => {
		// Implementation for updating cookie
		console.log('Updating cookie:', id, updates);
	};

	const handleDeleteCookie = (id: string) => {
		// Implementation for deleting cookie
		console.log('Deleting cookie:', id);
	};

	const handleDeleteAllCookies = () => {
		cookieService.clearAll();
	};

	const handleImportCookies = (cookies: Cookie[]) => {
		cookies.forEach(cookie => cookieService.addCookie(cookie));
	};

	const handleExportCookies = (exportConfig: CookieImportExport) => {
		const exported = cookieService.exportCookies(exportConfig.format);
		console.log('Exported cookies:', exported);
	};

	// Load cookies on component mount
	useEffect(() => {
		const loadedCookies = cookieService.getAllCookies();
		setCookies(loadedCookies);
	}, []);

	const handleSendRequest = async () => {
		setLoading(true);
		setResponseData(null);
		const vscode = vscodeApi.current;

		// Validate and construct URL
		let requestUrl = url.trim();
		if (!requestUrl) {
			requestUrl = 'api.example.com/data';
		}

		// Ensure URL doesn't have protocol prefix (it will be added by protocol selection)
		requestUrl = requestUrl.replace(/^https?:\/\//, '');

		const fullUrl = `${protocol}://${requestUrl}`;

		// Validate the constructed URL
		try {
			new URL(fullUrl);
		} catch (error) {
			console.error('Invalid URL:', fullUrl);
			setResponseData({
				status: 0,
				statusText: 'Invalid URL',
				headers: {},
				body: `Invalid URL: ${fullUrl}. Please check the URL format.`,
				contentType: 'text/plain',
				size: 0,
				duration: 0,
				isError: true,
				error: `Invalid URL format: ${fullUrl}`,
			});
			setLoading(false);
			return;
		}

		// Create request configuration for cookie integration
		const requestConfig: RequestConfig = {
			url: fullUrl,
			method: method as any,
			headers,
			auth,
			body: {
				type: 'raw',
				formData: [],
				urlEncoded: [],
				raw: {
					content: requestBody,
					language: 'json',
					autoFormat: true,
				},
				binary: {},
				graphql: {
					query: '',
					variables: '',
				},
			},
		};

		// Process request through cookie integration (adds cookies)
		const processedRequest = cookieIntegration.current.processRequest(requestConfig);

		vscode.postMessage({
			command: 'sendRequest',
			url: fullUrl,
			method: method,
			body: requestBody,
			headers: processedRequest.headers, // Use processed headers with cookies
			params: params,
		});
	};

	React.useEffect(() => {
		if (!vscodeApi.current) {
			// @ts-ignore
			vscodeApi.current = acquireVsCodeApi();
		}
		const handleMessage = (event: MessageEvent) => {
			const message = event.data;
			switch (message.command) {
				case 'apiResponse': {
					// Check for error response first
					if (message.data && message.data.error) {
						const errorResponseData: ResponseData = {
							status: 0,
							statusText: 'Error',
							headers: {},
							body: message.data.error,
							contentType: 'text/plain',
							size: message.data.error.length,
							duration: 0,
							isError: true,
							error: message.data.error,
						};
						setResponseData(errorResponseData);
						setResponse(message.data.error);
						setLoading(false);
						break;
					}

					// Ensure message.data exists and is valid
					if (!message.data || typeof message.data !== 'object') {
						console.warn('Received invalid apiResponse data:', message.data);
						const invalidResponseData: ResponseData = {
							status: 0,
							statusText: 'Invalid Response',
							headers: {},
							body: 'Invalid response data received',
							contentType: 'text/plain',
							size: 0,
							duration: 0,
							isError: true,
							error: 'Invalid response data received',
						};
						setResponseData(invalidResponseData);
						setLoading(false);
						return;
					}

					// Process response through cookie integration (extracts and stores cookies)
					const httpResponse = {
						status: message.data.status || 0,
						statusText: message.data.statusText || '',
						headers: message.data.headers || {},
						data: message.data.body,
						responseTime: message.data.responseTime || 0,
					};

					// Process cookies from response
					if (httpResponse.headers) {
						let requestUrl = url.trim() || 'api.example.com/data';
						requestUrl = requestUrl.replace(/^https?:\/\//, '');
						const fullRequestUrl = `${protocol}://${requestUrl}`;

						try {
							cookieIntegration.current.processResponse(httpResponse, fullRequestUrl);
						} catch (error) {
							console.warn('Failed to process cookies from response:', error);
						}
					}

					// Create enhanced response data for response viewer
					let responseBodyString: string;
					if (typeof httpResponse.data === 'string') {
						responseBodyString = httpResponse.data;
					} else if (httpResponse.data !== null && httpResponse.data !== undefined) {
						responseBodyString = JSON.stringify(httpResponse.data, null, 2);
					} else {
						responseBodyString = '';
					}

					const enhancedResponseData: ResponseData = {
						status: httpResponse.status,
						statusText: httpResponse.statusText,
						headers: httpResponse.headers,
						body: responseBodyString,
						contentType: httpResponse.headers['content-type'] || httpResponse.headers['Content-Type'] || 'text/plain',
						size: new Blob([responseBodyString]).size,
						duration: httpResponse.responseTime,
						isError: httpResponse.status >= 400,
					};

					setResponseData(enhancedResponseData);
					setResponse(JSON.stringify(message.data, null, 2));
					setLoading(false);
					break;
				}
				case 'loadRequest': {
					// Load request data from tree view selection
					const requestData = message.data;
					if (!requestData || typeof requestData !== 'object') {
						console.warn('Received invalid loadRequest data:', requestData);
						return;
					}

					if (requestData.method) setMethod(requestData.method);
					if (requestData.url) setUrl(requestData.url);
					if (requestData.headers) setHeaders(requestData.headers);
					if (requestData.body) setRequestBody(typeof requestData.body === 'string' ? requestData.body : JSON.stringify(requestData.body));
					if (requestData.auth) setAuth(requestData.auth);
					break;
				}
			}
		};

		window.addEventListener('message', handleMessage);

		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, []);

	return (
		<div className='flex flex-col h-screen bg-background text-foreground'>
			<ResizablePanelGroup direction='vertical'>
				<ResizablePanel defaultSize={60} minSize={10}>
					<div className='flex flex-col h-full p-4 gap-4'>
						{/* Request Section */}
						<div className='flex space-x-2 flex-shrink-0'>
							<Select onValueChange={setMethod} defaultValue={method}>
								<SelectTrigger className='w-[140px]'>
									<SelectValue placeholder='Method' />
								</SelectTrigger>
								<SelectContent className='w-[140px]'>
									<SelectItem value='GET'>GET</SelectItem>
									<SelectItem value='POST'>POST</SelectItem>
									<SelectItem value='PUT'>PUT</SelectItem>
									<SelectItem value='PATCH'>PATCH</SelectItem>
									<SelectItem value='DELETE'>DELETE</SelectItem>
									<SelectItem value='HEAD'>HEAD</SelectItem>
									<SelectItem value='OPTIONS'>OPTIONS</SelectItem>
								</SelectContent>
							</Select>
							<Select onValueChange={setProtocol} defaultValue={protocol}>
								<SelectTrigger className='w-[120px]'>
									<SelectValue placeholder='Protocol' />
								</SelectTrigger>
								<SelectContent className='w-[120px]'>
									<SelectItem value='https'>https://</SelectItem>
									<SelectItem value='http'>http://</SelectItem>
								</SelectContent>
							</Select>
							<Input id='url' className='flex-1' placeholder='api.example.com/data' value={url} onChange={e => setUrl(e.target.value)} onBlur={handleUrlBlur} />
							<Button onClick={handleSendRequest}>Send</Button>
						</div>

						<Tabs defaultValue='params' className='flex-1 flex flex-col min-h-0'>
							<TabsList className='flex-shrink-0'>
								<TabsTrigger value='params'>Params</TabsTrigger>
								<TabsTrigger value='headers'>Headers</TabsTrigger>
								<TabsTrigger value='auth'>Authorization</TabsTrigger>
								<TabsTrigger value='body'>Body</TabsTrigger>
								<TabsTrigger value='cookies'>Cookies</TabsTrigger>
								<TabsTrigger value='curl'>cURL</TabsTrigger>
								<TabsTrigger value='pre-request'>Pre-request Script</TabsTrigger>
								<TabsTrigger value='tests'>Tests</TabsTrigger>
								<TabsTrigger value='settings'>Settings</TabsTrigger>
							</TabsList>
							<TabsContent value='params' className='flex-1 min-h-0 overflow-y-auto'>
								<ParamsTab params={params} onParamsChange={setParams} />
							</TabsContent>
							<TabsContent value='headers' className='flex-1 min-h-0 overflow-y-auto'>
								<HeadersTab headers={headers} onHeadersChange={setHeaders} />
							</TabsContent>
							<TabsContent value='auth' className='flex-1 min-h-0 overflow-y-auto'>
								<AuthTab auth={auth} onAuthChange={setAuth} />
							</TabsContent>
							<TabsContent value='body' className='flex-1 min-h-0 overflow-y-auto'>
								<BodyTab requestBody={requestBody} onRequestBodyChange={setRequestBody} onContentTypeChange={handleContentTypeChange} />
							</TabsContent>
							<TabsContent value='cookies' className='flex-1 min-h-0 overflow-y-auto'>
								<CookieManager
									cookies={cookies}
									onAddCookie={handleAddCookie}
									onUpdateCookie={handleUpdateCookie}
									onDeleteCookie={handleDeleteCookie}
									onDeleteAll={handleDeleteAllCookies}
									onImport={handleImportCookies}
									onExport={handleExportCookies}
								/>
							</TabsContent>
							<TabsContent value='curl' className='flex-1 min-h-0 overflow-y-auto'>
								<CurlImportExport onImportRequest={handleCurlImport} currentRequest={currentRequest} onCopy={handleCurlCopy} />
							</TabsContent>
							<TabsContent value='pre-request' className='flex-1 min-h-0 overflow-y-auto'>
								<PreRequestScriptTab />
							</TabsContent>
							<TabsContent value='tests' className='flex-1 min-h-0 overflow-y-auto'>
								<TestsTab
									testSuites={testSuites}
									onTestSuitesChange={setTestSuites}
									onRunTests={handleRunTests}
									testExecutions={testExecutions}
									isRunning={isRunningTests}
								/>
							</TabsContent>
							<TabsContent value='settings' className='flex-1 min-h-0 overflow-y-auto'>
								<SettingsTab />
							</TabsContent>
						</Tabs>
					</div>
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={40} minSize={5}>
					<div className='h-full w-full'>
						{/* Response Section */}
						{responseData ? (
							<ResponseViewer response={responseData} isLoading={loading} onDownload={handleResponseDownload} onCopy={handleResponseCopy} className='h-full' />
						) : (
							<div className='flex items-center justify-center h-full'>
								<p className='text-sm text-muted-foreground'>{loading ? 'Loading...' : 'Send a request to see the response.'}</p>
							</div>
						)}
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

export default App;

