import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, FileText, Play, Upload } from 'lucide-react';
import { parseCurlCommand, generateCurlCommand, validateCurlCommand } from '@/utils/curl';
import type { RequestConfig } from '@/types/request';
import type { AuthConfig } from '@/types/auth';
import { createDefaultRequestBody, type RequestBodyConfig } from '@/types/body';

// Helper function to convert cURL auth format to AuthConfig
function convertCurlAuthToAuthConfig(curlAuth: { type: 'basic' | 'bearer' | 'api-key'; credentials: Record<string, string> }): AuthConfig {
	switch (curlAuth.type) {
		case 'basic':
			return {
				type: 'basic',
				basic: {
					username: curlAuth.credentials.username || '',
					password: curlAuth.credentials.password || '',
					showPassword: false,
				},
			};
		case 'bearer':
			return {
				type: 'bearer',
				bearer: {
					token: curlAuth.credentials.token || '',
					prefix: curlAuth.credentials.prefix || 'Bearer',
				},
			};
		case 'api-key':
			return {
				type: 'apikey',
				apikey: {
					key: curlAuth.credentials.key || '',
					value: curlAuth.credentials.value || '',
					addTo: 'header',
				},
			};
		default:
			return { type: 'none' };
	}
}

// Helper function to convert AuthConfig to cURL auth format
function convertAuthConfigToCurlAuth(auth: AuthConfig):
	| {
			type: 'basic' | 'bearer' | 'api-key';
			credentials: Record<string, string>;
	}
	| undefined {
	switch (auth.type) {
		case 'basic':
			return {
				type: 'basic',
				credentials: {
					username: auth.basic?.username || '',
					password: auth.basic?.password || '',
				},
			};
		case 'bearer':
			return {
				type: 'bearer',
				credentials: {
					token: auth.bearer?.token || '',
					prefix: auth.bearer?.prefix || 'Bearer',
				},
			};
		case 'apikey':
			return {
				type: 'api-key',
				credentials: {
					key: auth.apikey?.key || '',
					value: auth.apikey?.value || '',
				},
			};
		default:
			return undefined;
	}
}

interface CurlImportExportProps {
	onImportRequest?: (request: RequestConfig) => void;
	currentRequest?: RequestConfig;
	onCopy?: (curlCommand: string) => void;
}

export function CurlImportExport({ onImportRequest, currentRequest, onCopy }: CurlImportExportProps) {
	const [curlCommand, setCurlCommand] = useState('');
	const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
	const [importError, setImportError] = useState('');
	const [importSuccess, setImportSuccess] = useState('');
	const [exportedCurl, setExportedCurl] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleImport = () => {
		setImportError('');
		setImportSuccess('');

		if (!curlCommand.trim()) {
			setImportError('Please enter a cURL command');
			return;
		}

		// Validate cURL command
		const validation = validateCurlCommand(curlCommand);
		if (!validation.valid) {
			setImportError(`Invalid cURL command: ${validation.errors.join(', ')}`);
			return;
		}

		// Parse cURL command
		const parseResult = parseCurlCommand(curlCommand);
		if (!parseResult.success) {
			setImportError(`Failed to parse cURL command: ${parseResult.errors.join(', ')}`);
			return;
		}

		// Convert to RequestConfig
		const requestConfig: RequestConfig = {
			url: parseResult.url,
			method: parseResult.method.toUpperCase() as any,
			headers: parseResult.headers,
			auth: parseResult.auth ? convertCurlAuthToAuthConfig(parseResult.auth) : { type: 'none' },
			body: parseResult.body || createDefaultRequestBody(),
		};

		// Call the import callback
		if (onImportRequest) {
			onImportRequest(requestConfig);
			setImportSuccess('cURL command imported successfully!');
			setCurlCommand('');
		}
	};

	const handleExport = () => {
		if (!currentRequest) {
			setImportError('No request to export');
			return;
		}

		try {
			// Convert AuthConfig to cURL auth format
			const curlAuthConfig = currentRequest.auth ? convertAuthConfigToCurlAuth(currentRequest.auth) : undefined;

			const curlOptions: {
				url: string;
				method: string;
				headers?: Record<string, string>;
				body?: RequestBodyConfig;
				auth?: {
					type: 'basic' | 'bearer' | 'api-key';
					credentials: Record<string, string>;
				};
			} = {
				url: currentRequest.url,
				method: currentRequest.method,
				headers: currentRequest.headers,
				body: currentRequest.body,
				auth: curlAuthConfig,
			};

			const curlCommand = generateCurlCommand(curlOptions);
			setExportedCurl(curlCommand);
			setImportError('');
		} catch (error) {
			setImportError(`Failed to generate cURL command: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	};

	const handleCopyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			if (onCopy) {
				onCopy(text);
			}
		} catch (error) {
			// Fallback for environments where clipboard API is not available
			if (textareaRef.current) {
				textareaRef.current.select();
				document.execCommand('copy');
			}
		}
	};

	const handlePasteFromClipboard = async () => {
		try {
			const text = await navigator.clipboard.readText();
			setCurlCommand(text);
		} catch (error) {
			// Clipboard API not available or permission denied
			console.warn('Could not access clipboard');
		}
	};

	const clearImport = () => {
		setCurlCommand('');
		setImportError('');
		setImportSuccess('');
	};

	const clearExport = () => {
		setExportedCurl('');
		setImportError('');
	};

	return (
		<Card className='w-full'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<FileText className='w-5 h-5' />
					cURL Import/Export
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'import' | 'export')}>
					<TabsList className='grid w-full grid-cols-2'>
						<TabsTrigger value='import' className='flex items-center gap-2'>
							<Upload className='w-4 h-4' />
							Import
						</TabsTrigger>
						<TabsTrigger value='export' className='flex items-center gap-2'>
							<Copy className='w-4 h-4' />
							Export
						</TabsTrigger>
					</TabsList>

					<TabsContent value='import' className='space-y-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>cURL Command</label>
							<div className='space-y-2'>
								<Textarea
									ref={textareaRef}
									placeholder="curl -X GET 'https://api.example.com/users' -H 'Authorization: Bearer token123'"
									value={curlCommand}
									onChange={e => setCurlCommand(e.target.value)}
									className='font-mono text-sm min-h-[120px]'
								/>
								<div className='flex gap-2'>
									<Button variant='outline' size='sm' onClick={handlePasteFromClipboard}>
										Paste
									</Button>
									<Button variant='outline' size='sm' onClick={clearImport}>
										Clear
									</Button>
								</div>
							</div>
						</div>

						{importError && (
							<Alert variant='destructive'>
								<AlertDescription>{importError}</AlertDescription>
							</Alert>
						)}

						{importSuccess && (
							<Alert>
								<AlertDescription className='text-green-600'>{importSuccess}</AlertDescription>
							</Alert>
						)}

						<div className='flex gap-2'>
							<Button onClick={handleImport} disabled={!curlCommand.trim()} className='flex items-center gap-2'>
								<Play className='w-4 h-4' />
								Import Request
							</Button>
						</div>

						<div className='text-sm text-gray-600 space-y-1'>
							<p>
								<strong>Supported features:</strong>
							</p>
							<ul className='list-disc list-inside space-y-1 ml-4'>
								<li>HTTP methods (GET, POST, PUT, DELETE, etc.)</li>
								<li>Headers (-H, --header)</li>
								<li>Request body (-d, --data, --data-raw)</li>
								<li>Authentication (Basic, Bearer token)</li>
								<li>Query parameters</li>
								<li>Form data (--form)</li>
								<li>User agent (-A, --user-agent)</li>
								<li>Custom options (--compressed, --insecure, etc.)</li>
							</ul>
						</div>
					</TabsContent>

					<TabsContent value='export' className='space-y-4'>
						<div className='space-y-2'>
							<div className='flex justify-between items-center'>
								<label className='text-sm font-medium'>Generated cURL Command</label>
								<Button onClick={handleExport} disabled={!currentRequest} size='sm'>
									Generate
								</Button>
							</div>

							{exportedCurl ? (
								<div className='space-y-2'>
									<Textarea value={exportedCurl} readOnly className='font-mono text-sm min-h-[120px]' />
									<div className='flex gap-2'>
										<Button variant='outline' size='sm' onClick={() => handleCopyToClipboard(exportedCurl)} className='flex items-center gap-2'>
											<Copy className='w-4 h-4' />
											Copy
										</Button>
										<Button variant='outline' size='sm' onClick={clearExport}>
											Clear
										</Button>
									</div>
								</div>
							) : (
								<div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center'>
									<FileText className='w-12 h-12 mx-auto text-gray-400 mb-4' />
									<p className='text-gray-600'>
										{currentRequest
											? 'Click Generate to create a cURL command from your current request'
											: 'Configure a request first to generate a cURL command'}
									</p>
								</div>
							)}
						</div>

						{importError && (
							<Alert variant='destructive'>
								<AlertDescription>{importError}</AlertDescription>
							</Alert>
						)}

						<div className='text-sm text-gray-600 space-y-1'>
							<p>
								<strong>Export features:</strong>
							</p>
							<ul className='list-disc list-inside space-y-1 ml-4'>
								<li>Complete request replication</li>
								<li>Cross-platform compatibility</li>
								<li>Proper escaping and quoting</li>
								<li>Authentication headers</li>
								<li>Request body and form data</li>
								<li>Custom headers and options</li>
							</ul>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
