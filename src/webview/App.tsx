import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ParamsTab from '@/components/request-tabs/ParamsTab';
import HeadersTab from '@/components/request-tabs/HeadersTab';
import BodyTab from '@/components/request-tabs/BodyTab';
import AuthTab from '@/components/request-tabs/AuthTab';
import PreRequestScriptTab from '@/components/request-tabs/PreRequestScriptTab';
import TestsTab from '@/components/request-tabs/TestsTab';
import SettingsTab from '@/components/request-tabs/SettingsTab';

import { AuthConfig } from '@/types/auth';
import { TestSuite, TestExecution } from '@/types/testing';
import { applyAuthentication } from '@/utils/auth';
import { testExecutor, createResponseTestData } from '@/utils/testExecutor';

function App() {
	const [protocol, setProtocol] = useState('https');
	const [url, setUrl] = useState('');
	const [method, setMethod] = useState('GET');
	const [requestBody, setRequestBody] = useState('');
	const [headers, setHeaders] = useState<Record<string, string>>({});
	const [params, setParams] = useState<Record<string, string>>({});
	const [auth, setAuth] = useState<AuthConfig>({ type: 'none' });
	const [response, setResponse] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// Testing state
	const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
	const [testExecutions, setTestExecutions] = useState<TestExecution[]>([]);
	const [isRunningTests, setIsRunningTests] = useState(false);

	const vscodeApi = useRef<any>(null);

	// Handle content type changes from body tab
	const handleContentTypeChange = (contentType: string) => {
		setHeaders(prev => ({
			...prev,
			'Content-Type': contentType,
		}));
	};

	const handleUrlBlur = () => {
		let currentUrl = url;
		let currentProtocol = protocol;
		const currentParams: Record<string, string> = {};

		// Extract protocol
		const protocolMatch = currentUrl.match(/^(https?:\/\/)/);
		if (protocolMatch) {
			currentProtocol = protocolMatch[1].slice(0, -3); // Remove trailing ://
			currentUrl = currentUrl.replace(protocolMatch[1], '');
			setProtocol(currentProtocol);
		}

		// Extract parameters
		const paramIndex = currentUrl.indexOf('?');
		if (paramIndex !== -1) {
			const queryString = currentUrl.substring(paramIndex + 1);
			currentUrl = currentUrl.substring(0, paramIndex);
			const urlParams = new URLSearchParams(queryString);
			urlParams.forEach((value, key) => {
				currentParams[key] = value;
			});
		}
		setParams(currentParams);
		setUrl(currentUrl);
	};

	// Handle test execution
	const handleRunTests = async (suiteId: string) => {
		const suite = testSuites.find(s => s.id === suiteId);
		if (!suite || !response) return;

		setIsRunningTests(true);
		try {
			// In a real app, we'd have the actual response data
			// For now, we'll create mock response data
			const mockResponseData = {
				status: 200,
				statusText: 'OK',
				headers: headers,
				body: response,
				contentType: headers['Content-Type'] || 'application/json',
				responseTime: 150,
				size: response.length,
				data: (() => {
					try {
						return JSON.parse(response);
					} catch {
						return undefined;
					}
				})(),
			};

			const execution = await testExecutor.executeTestSuite(suite, mockResponseData);
			setTestExecutions(prev => [execution, ...prev.slice(0, 9)]); // Keep last 10 executions
		} catch (error) {
			console.error('Test execution failed:', error);
		} finally {
			setIsRunningTests(false);
		}
	};

	const handleSendRequest = async () => {
		setLoading(true);
		const vscode = vscodeApi.current;
		const fullUrl = `${protocol}://${url}`;

		try {
			// Apply authentication to headers and params
			const { headers: authHeaders, params: authParams } = await applyAuthentication(auth, method, fullUrl, headers, params, requestBody);

			console.log('Sending request to:', fullUrl, 'with method:', method, 'and body:', requestBody, 'headers:', authHeaders, 'params:', authParams);
			vscode.postMessage({
				command: 'sendRequest',
				url: fullUrl,
				method: method,
				body: requestBody,
				headers: authHeaders,
				params: authParams,
			});
		} catch (error) {
			console.error('Authentication error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
			setResponse(`Authentication Error: ${errorMessage}`);
			setLoading(false);
		}
	};

	React.useEffect(() => {
		if (!vscodeApi.current) {
			// @ts-ignore
			vscodeApi.current = acquireVsCodeApi();
		}
		const handleMessage = (event: MessageEvent) => {
			const message = event.data;
			switch (message.command) {
				case 'apiResponse':
					setResponse(JSON.stringify(message.data, null, 2));
					setLoading(false);
					break;
			}
		};

		window.addEventListener('message', handleMessage);

		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, []);

	return (
		<div className='flex flex-col h-screen p-4 gap-4' style={{ scrollbarGutter: 'stable' }}>
			{/* Request Section - 60% of screen height */}
			<Card className='h-[60vh] flex flex-col' style={{ scrollbarGutter: 'stable' }}>
				<CardHeader className='flex-shrink-0'>
					<CardTitle>API Request</CardTitle>
				</CardHeader>
				<CardContent className='flex-1 flex flex-col min-h-0 gap-4' style={{ scrollbarGutter: 'stable' }}>
					{/* HTTP Request Controls - Fixed height */}
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

					{/* Tabs Section - Takes remaining space with scrollable content */}
					<Tabs defaultValue='params' className='flex-1 flex flex-col min-h-0'>
						<TabsList className='flex-shrink-0'>
							<TabsTrigger value='params'>Params</TabsTrigger>
							<TabsTrigger value='headers'>Headers</TabsTrigger>
							<TabsTrigger value='auth'>Authorization</TabsTrigger>
							<TabsTrigger value='body'>Body</TabsTrigger>
							<TabsTrigger value='pre-request'>Pre-request Script</TabsTrigger>
							<TabsTrigger value='tests'>Tests</TabsTrigger>
							<TabsTrigger value='settings'>Settings</TabsTrigger>
						</TabsList>
						<TabsContent value='params' className='flex-1 min-h-0 overflow-y-auto p-4 stable-scrollbar'>
							<ParamsTab params={params} onParamsChange={setParams} />
						</TabsContent>
						<TabsContent value='headers' className='flex-1 min-h-0 overflow-y-auto p-4 stable-scrollbar'>
							<HeadersTab headers={headers} onHeadersChange={setHeaders} />
						</TabsContent>
						<TabsContent value='auth' className='flex-1 min-h-0 overflow-y-auto p-4 stable-scrollbar'>
							<AuthTab auth={auth} onAuthChange={setAuth} />
						</TabsContent>
						<TabsContent value='body' className='flex-1 min-h-0 overflow-y-auto p-4 stable-scrollbar'>
							<BodyTab requestBody={requestBody} onRequestBodyChange={setRequestBody} onContentTypeChange={handleContentTypeChange} />
						</TabsContent>
						<TabsContent value='pre-request' className='flex-1 min-h-0 overflow-y-auto p-4 stable-scrollbar'>
							<PreRequestScriptTab />
						</TabsContent>
						<TabsContent value='tests' className='flex-1 min-h-0 overflow-y-auto p-4 stable-scrollbar'>
							<TestsTab
								testSuites={testSuites}
								onTestSuitesChange={setTestSuites}
								onRunTests={handleRunTests}
								testExecutions={testExecutions}
								isRunning={isRunningTests}
							/>
						</TabsContent>
						<TabsContent value='settings' className='flex-1 min-h-0 overflow-y-auto p-4 stable-scrollbar'>
							<SettingsTab />
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Response Section - 40% of screen height */}
			<Card className='h-[40vh] flex flex-col' style={{ scrollbarGutter: 'stable' }}>
				<CardHeader className='flex-shrink-0'>
					<CardTitle>API Response</CardTitle>
				</CardHeader>
				<CardContent className='flex-1 min-h-0' style={{ scrollbarGutter: 'stable' }}>
					<pre className='whitespace-pre-wrap text-sm bg-background p-4 rounded-md h-full overflow-auto stable-scrollbar'>
						{loading ? 'Loading...' : response || 'Send a request to see the response.'}
					</pre>
				</CardContent>
			</Card>
		</div>
	);
}

export default App;

