import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ParamsTab from '@/components/request-tabs/ParamsTab';
import HeadersTab from '@/components/request-tabs/HeadersTab';
import AuthTab from '@/components/request-tabs/AuthTab';
import BodyTab from '@/components/request-tabs/BodyTab';
import PreRequestScriptTab from '@/components/request-tabs/PreRequestScriptTab';
import TestsTab from '@/components/request-tabs/TestsTab';
import SettingsTab from '@/components/request-tabs/SettingsTab';
import { TestSuite, TestExecution } from '@/types/testing';
import { AuthConfig } from '@/types/auth';

declare const acquireVsCodeApi: () => any;

function App() {
	const vscodeApi = useRef<any>(null);
	const [url, setUrl] = useState('api.example.com/data');
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

	const handleUrlBlur = () => {
		if (url && !url.startsWith('http')) {
			// Auto-extract protocol if user enters full URL
			if (url.startsWith('https://')) {
				setProtocol('https');
				setUrl(url.replace('https://', ''));
			} else if (url.startsWith('http://')) {
				setProtocol('http');
				setUrl(url.replace('http://', ''));
			}
		}
	};

	const handleContentTypeChange = (contentType: string) => {
		setHeaders(prev => ({
			...prev,
			'Content-Type': contentType
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
						message: `Test assertion for ${assertion.description || assertion.type}`
					}))
				};
				execution.failedTests = execution.totalTests - execution.passedTests;
				setTestExecutions(prev => [...prev, execution]);
			}
			setIsRunningTests(false);
		}, 1000);
	};

	const handleSendRequest = async () => {
		setLoading(true);
		const vscode = vscodeApi.current;
		const fullUrl = `${protocol}://${url}`;

		vscode.postMessage({
			command: 'sendRequest',
			url: fullUrl,
			method: method,
			body: requestBody,
			headers: headers,
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
				case 'apiResponse':
					setResponse(JSON.stringify(message.data, null, 2));
					setLoading(false);
					break;
				case 'loadRequest': {
					// Load request data from tree view selection
					const requestData = message.data;
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
		<div className='flex flex-col h-screen p-4 gap-4'>
			{/* Request Section - 60% of screen height */}
			<Card className='h-[60vh] flex flex-col'>
				<CardHeader className='flex-shrink-0'>
					<CardTitle>API Request</CardTitle>
				</CardHeader>
				<CardContent className='flex-1 flex flex-col min-h-0 gap-4'>
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
						<TabsContent value='params' className='flex-1 min-h-0 p-4 force-scrollbar-visible'>
							<ParamsTab params={params} onParamsChange={setParams} />
						</TabsContent>
						<TabsContent value='headers' className='flex-1 min-h-0 p-4 force-scrollbar-visible'>
							<HeadersTab headers={headers} onHeadersChange={setHeaders} />
						</TabsContent>
						<TabsContent value='auth' className='flex-1 min-h-0 p-4 force-scrollbar-visible'>
							<AuthTab auth={auth} onAuthChange={setAuth} />
						</TabsContent>
						<TabsContent value='body' className='flex-1 min-h-0 p-4 force-scrollbar-visible'>
							<BodyTab requestBody={requestBody} onRequestBodyChange={setRequestBody} onContentTypeChange={handleContentTypeChange} />
						</TabsContent>
						<TabsContent value='pre-request' className='flex-1 min-h-0 p-4 force-scrollbar-visible'>
							<PreRequestScriptTab />
						</TabsContent>
						<TabsContent value='tests' className='flex-1 min-h-0 p-4 force-scrollbar-visible'>
							<TestsTab
								testSuites={testSuites}
								onTestSuitesChange={setTestSuites}
								onRunTests={handleRunTests}
								testExecutions={testExecutions}
								isRunning={isRunningTests}
							/>
						</TabsContent>
						<TabsContent value='settings' className='flex-1 min-h-0 p-4 force-scrollbar-visible'>
							<SettingsTab />
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Response Section - 40% of screen height */}
			<Card className='h-[40vh] flex flex-col'>
				<CardHeader className='flex-shrink-0'>
					<CardTitle>API Response</CardTitle>
				</CardHeader>
				<CardContent className='flex-1 min-h-0'>
					<pre className='whitespace-pre-wrap text-sm bg-background p-4 rounded-md h-full force-scrollbar-visible'>
						{loading ? 'Loading...' : response || 'Send a request to see the response.'}
					</pre>
				</CardContent>
			</Card>
		</div>
	);
}

export default App;
