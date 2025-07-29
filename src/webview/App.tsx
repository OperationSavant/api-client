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

function App() {
	const [protocol, setProtocol] = useState('https');
	const [url, setUrl] = useState('');
	const [method, setMethod] = useState('GET');
	const [requestBody, setRequestBody] = useState('');
	const [headers, setHeaders] = useState<Record<string, string>>({});
	const [params, setParams] = useState<Record<string, string>>({});
	const [response, setResponse] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const vscodeApi = useRef<any>(null);

	const handleUrlBlur = () => {
		let currentUrl = url;
		let currentProtocol = protocol;
		let currentParams: Record<string, string> = {};

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

	const handleSendRequest = () => {
		setLoading(true);
		const vscode = vscodeApi.current;
		let fullUrl = `${protocol}://${url}`;
		console.log('Sending request to:', fullUrl, 'with method:', method, 'and body:', requestBody, 'headers:', headers, 'params:', params);
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
			}
		};

		window.addEventListener('message', handleMessage);

		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, []);

	return (
		<div className='flex flex-col h-screen'>
			<Card className='min-h-2/3 max-h-2/3 bg-red-800'>
				<CardHeader>
					<CardTitle>API Request</CardTitle>
				</CardHeader>
				<CardContent className='flex-1 flex flex-col overflow-hidden'>
					<div className='flex-1 flex flex-col gap-4'>
						<div className='flex space-x-2'>
							<Select onValueChange={setMethod} defaultValue={method}>
								<SelectTrigger className='w-[140px]'>
									<SelectValue placeholder='Method' />
								</SelectTrigger>
								<SelectContent className='w-[140px]'>
									<SelectItem value='GET'>GET</SelectItem>
									<SelectItem value='POST'>POST</SelectItem>
									<SelectItem value='PUT'>PUT</SelectItem>
									<SelectItem value='DELETE'>DELETE</SelectItem>
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

						<Tabs defaultValue='params' className='w-full flex-1 flex flex-col'>
							<TabsList>
								<TabsTrigger value='params'>Params</TabsTrigger>
								<TabsTrigger value='headers'>Headers</TabsTrigger>
								<TabsTrigger value='auth'>Authorization</TabsTrigger>
								<TabsTrigger value='body'>Body</TabsTrigger>
								<TabsTrigger value='pre-request'>Pre-request Script</TabsTrigger>
								<TabsTrigger value='tests'>Tests</TabsTrigger>
								<TabsTrigger value='settings'>Settings</TabsTrigger>
							</TabsList>
							<TabsContent value='params' className='flex flex-col h-4/5 bg-amber-500'>
								<ParamsTab params={params} onParamsChange={setParams} />
							</TabsContent>
							<TabsContent value='headers' className='flex flex-col'>
								<HeadersTab headers={headers} onHeadersChange={setHeaders} />
							</TabsContent>
							<TabsContent value='auth' className='flex flex-col'>
								<AuthTab />
							</TabsContent>
							<TabsContent value='body' className='flex flex-col'>
								<BodyTab requestBody={requestBody} onRequestBodyChange={setRequestBody} />
							</TabsContent>
							<TabsContent value='pre-request' className='flex flex-col'>
								<PreRequestScriptTab />
							</TabsContent>
							<TabsContent value='tests' className='flex flex-col'>
								<TestsTab />
							</TabsContent>
							<TabsContent value='settings' className='flex flex-col'>
								<SettingsTab />
							</TabsContent>
						</Tabs>
					</div>
				</CardContent>
			</Card>

			<Card className='mt-4 flex-[2] flex flex-col'>
				<CardHeader>
					<CardTitle>API Response</CardTitle>
				</CardHeader>
				<CardContent className='flex-1 flex flex-col'>
					<pre className='whitespace-pre-wrap text-sm bg-background p-4 rounded-md flex-1 overflow-auto'>
						{loading ? 'Loading...' : response || 'Send a request to see the response.'}
					</pre>
				</CardContent>
			</Card>
		</div>
	);
}

export default App;

