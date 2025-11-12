import { ExtensionContext, WebviewPanel } from 'vscode';
import { storageService } from '@/domain/services/storageService';
import { MessageRouter } from '@/extension/orchestrators/message-router';
import { WebviewOrchestrator } from '@/extension/orchestrators/webview-orchestrator';
import { ViewOrchestrator } from '@/extension/orchestrators/view-orchestrator';
import { ApplicationServices } from '@/extension/services/application-services';
import { CommandRegistry } from '@/extension/commands/command-registry';
import { StateManager } from './services/state-manager';

export function activate(context: ExtensionContext) {
	const services = new ApplicationServices(context);
	const messageRouter = new MessageRouter(services);
	const webviewOrchestrator = new WebviewOrchestrator({ context, messageRouter });
	const viewOrchestrator = new ViewOrchestrator(context);
	const panels = new Map<string, WebviewPanel>();
	storageService.initialize(context);
	// const state = storageService.loadState();
	// if (state) {
	// 	collectionService.importData(state.collections);
	// 	historyService.importData(state.history);
	// 	environmentService.importData(state.environments);
	// }
	StateManager.loadState();

	// const collectionsProvider = new CollectionsTreeProvider();
	// const historyProvider = new HistoryTreeProvider();
	// const environmentProvider = new EnvironmentTreeProvider();

	// window.createTreeView('apiClient.collections', {
	// 	treeDataProvider: collectionsProvider,
	// 	showCollapseAll: true,
	// });

	// window.createTreeView('apiClient.history', {
	// 	treeDataProvider: historyProvider,
	// 	showCollapseAll: true,
	// });

	// window.createTreeView('apiClient.environment', {
	// 	treeDataProvider: environmentProvider,
	// 	showCollapseAll: true,
	// });

	// collectionsProvider.refresh();
	// historyProvider.refresh();
	// environmentProvider.refresh();

	const commandRegistry = new CommandRegistry({
		context,
		// providers: viewOrchestrator.getProviders(),
		saveState: () => StateManager.saveState(),
		createWebview: (tabId, name, args) => {
			const panel = webviewOrchestrator.createPanel(tabId, name, args);
			panel.onDidDispose(() => {
				panels.delete(tabId);
			});
			return panel;
		},
		panels,
	});
	commandRegistry.registerAll();

	// function sendThemeDataToWebview(panel: WebviewPanel) {
	// 	const themeName = workspace.getConfiguration('workbench').get('colorTheme');
	// 	const themeExtension = extensions.all.find(ext => ext.packageJSON?.contributes?.themes?.some((t: any) => t.label === themeName || t.id === themeName));

	// 	if (!themeExtension) {
	// 		return;
	// 	}

	// 	const themeInfo = themeExtension.packageJSON.contributes.themes.find((t: any) => t.label === themeName || t.id === themeName);
	// 	if (themeInfo) {
	// 		const themePath = path.join(themeExtension.extensionPath, themeInfo.path);
	// 		try {
	// 			const fileContent = fs.readFileSync(themePath, 'utf-8');

	// 			const themeContent = jsonc.parse(fileContent);
	// 			const tokenColors = themeContent.tokenColors || [];

	// 			panel.webview.postMessage({
	// 				command: 'themeData',
	// 				tokenColors: tokenColors,
	// 			});
	// 		} catch (e) {
	// 			console.error('Error reading theme file:', e);
	// 		}
	// 	} else {
	// 		console.error('ERROR: Could not find theme info in extension package.json.');
	// 	}
	// }

	// const collectionsProvider = new CollectionsTreeProvider();
	// const historyProvider = new HistoryTreeProvider();
	// const environmentProvider = new EnvironmentTreeProvider();

	// window.createTreeView('apiClient.collections', {
	// 	treeDataProvider: collectionsProvider,
	// 	showCollapseAll: true,
	// });

	// window.createTreeView('apiClient.history', {
	// 	treeDataProvider: historyProvider,
	// 	showCollapseAll: true,
	// });

	// window.createTreeView('apiClient.environment', {
	// 	treeDataProvider: environmentProvider,
	// 	showCollapseAll: true,
	// });

	// collectionsProvider.refresh();
	// historyProvider.refresh();
	// environmentProvider.refresh();

	// Register commands
	// context.subscriptions.push(
	// 	// Main API Client command
	// 	commands.registerCommand('apiClient.openRequest', (...args) => {
	// 		const tabId = uuidv4();
	// 		const request = args?.[0];
	// 		const panelName = request?.name || 'API Client';
	// 		const panel = createAndSetupWebviewPanel(context, tabId, panelName, args);
	// 		panels.set(tabId, panel);
	// 	}),

	// 	// Collection commands
	// 	commands.registerCommand('apiClient.createCollection', async () => {
	// 		const name = await window.showInputBox({
	// 			prompt: 'Enter collection name',
	// 			placeHolder: 'My Collection',
	// 		});
	// 		if (name) {
	// 			const description = await window.showInputBox({
	// 				prompt: 'Enter collection description (optional)',
	// 				placeHolder: 'Description',
	// 			});
	// 			collectionService.createCollection(name, description || undefined);
	// 			saveApplicationState();
	// 			collectionsProvider.refresh();
	// 			panels.forEach(panel => {
	// 				panel.webview.postMessage({
	// 					command: 'setCollections',
	// 					data: collectionService.getAllCollections(),
	// 				});
	// 			});
	// 			window.showInformationMessage(`Collection '${name}' created.`);
	// 		}
	// 	}),

	// 	commands.registerCommand('apiClient.deleteCollection', async item => {
	// 		if (item && item.collection) {
	// 			const confirmation = await window.showWarningMessage(`Delete collection "${item.collection.name}"?`, { modal: true }, 'Delete');
	// 			if (confirmation === 'Delete') {
	// 				collectionService.deleteCollection(item.collection.id);
	// 				saveApplicationState();
	// 				collectionsProvider.refresh();
	// 			}
	// 		}
	// 	}),

	// 	commands.registerCommand('apiClient.createRequest', async item => {
	// 		const tabId = uuidv4();
	// 		const panel = createAndSetupWebviewPanel(context, tabId);
	// 		panels.set(tabId, panel);
	// 	}),

	// 	commands.registerCommand('apiClient.deleteRequest', async item => {
	// 		if (item && item.request && item.collection) {
	// 			const confirmation = await window.showWarningMessage(`Delete request "${item.request.name}"?`, { modal: true }, 'Delete');
	// 			if (confirmation === 'Delete') {
	// 				collectionService.deleteRequest(item.collection.id, item.request.id);
	// 				saveApplicationState();
	// 				collectionsProvider.refresh();
	// 			}
	// 		}
	// 	}),

	// 	commands.registerCommand('apiClient.refreshCollections', () => {
	// 		collectionsProvider.refresh();
	// 	}),

	// 	// History commands
	// 	commands.registerCommand('apiClient.clearHistory', async () => {
	// 		const confirmation = await window.showWarningMessage('Clear all request history?', { modal: true }, 'Clear');
	// 		if (confirmation === 'Clear') {
	// 			historyService.clearHistory();
	// 			historyProvider.refresh();
	// 		}
	// 	}),

	// 	commands.registerCommand('apiClient.refreshHistory', () => {
	// 		historyProvider.refresh();
	// 	}),

	// 	// Environment commands
	// 	commands.registerCommand('apiClient.createEnvironment', async () => {
	// 		const name = await window.showInputBox({
	// 			prompt: 'Enter environment name',
	// 			placeHolder: 'Development',
	// 		});
	// 		if (name) {
	// 			const scopeType = await window.showQuickPick(['global', 'collection', 'request'], { placeHolder: 'Select scope type' });
	// 			if (scopeType) {
	// 				environmentService.createScope(name, scopeType as any);
	// 				saveApplicationState();
	// 				environmentProvider.refresh();
	// 			}
	// 		}
	// 	}),

	// 	commands.registerCommand('apiClient.deleteEnvironment', async item => {
	// 		if (item && item.scope) {
	// 			const confirmation = await window.showWarningMessage(`Delete environment "${item.scope.name}"?`, { modal: true }, 'Delete');
	// 			if (confirmation === 'Delete') {
	// 				environmentService.deleteScope(item.scope.id);
	// 				saveApplicationState();
	// 				environmentProvider.refresh();
	// 			}
	// 		}
	// 	}),

	// 	commands.registerCommand('apiClient.setActiveEnvironment', (scopeId: string) => {
	// 		environmentService.setActiveScope(scopeId);
	// 		saveApplicationState();
	// 		environmentProvider.refresh();
	// 	}),

	// 	commands.registerCommand('apiClient.refreshEnvironment', () => {
	// 		environmentProvider.refresh();
	// 	})
	// );

	// const getFormLength = (form: FormData): Promise<number> => {
	// 	return new Promise((resolve, reject) => {
	// 		form.getLength((err, length) => {
	// 			if (err) {
	// 				reject(err);
	// 			}
	// 			resolve(length);
	// 		});
	// 	});
	// };

	// function createAndSetupWebviewPanel(context: ExtensionContext, tabId: string, name?: string, args?: any[]): WebviewPanel {
	// 	const panel = window.createWebviewPanel('apiClient', name || 'New Request', ViewColumn.One, {
	// 		enableScripts: true,
	// 		localResourceRoots: [Uri.joinPath(context.extensionUri, 'dist')],
	// 	});

	// 	configureWebviewPanel(context, panel, tabId, args);
	// 	panel.onDidDispose(() => {
	// 		panels.delete(tabId);
	// 	});
	// 	return panel;
	// }

	// function configureWebviewPanel(context: ExtensionContext, panel: WebviewPanel, tabId: string, args?: any[]) {
	// 	const themeChangeDisposable = workspace.onDidChangeConfiguration(e => {
	// 		if (e.affectsConfiguration('workbench.colorTheme')) {
	// 			sendThemeDataToWebview(panel!);
	// 		}
	// 	});
	// 	panel.onDidDispose(() => {
	// 		themeChangeDisposable.dispose();
	// 	});

	// 	panel.webview.onDidReceiveMessage(
	// 		async message => {
	// switch (message.command) {
	// 	case 'generateOAuth2Token': {
	// 		const { oauth2Config } = message;
	// 		try {
	// 			const body = new URLSearchParams();
	// 			body.append('grant_type', oauth2Config.grantType);
	// 			if (oauth2Config.scope) {
	// 				body.append('scope', oauth2Config.scope);
	// 			}
	// 			if (oauth2Config.grantType === 'password') {
	// 				body.append('username', oauth2Config.username);
	// 				body.append('password', oauth2Config.password);
	// 			}
	// 			const headers: Record<string, string> = {
	// 				'Content-Type': 'application/x-www-form-urlencoded',
	// 			};
	// 			if (oauth2Config.clientAuth === 'header') {
	// 				const credentials = Buffer.from(`${oauth2Config.clientId}:${oauth2Config.clientSecret}`).toString('base64');
	// 				headers['Authorization'] = `Basic ${credentials}`;
	// 			} else {
	// 				body.append('client_id', oauth2Config.clientId);
	// 				body.append('client_secret', oauth2Config.clientSecret);
	// 			}
	// 			const response = await fetch(oauth2Config.tokenUrl, {
	// 				method: 'POST',
	// 				headers,
	// 				body: body.toString(),
	// 			});
	// 			if (!response.ok) {
	// 				window.showErrorMessage(`Token request failed: ${response.status} ${response.statusText}`);
	// 			}
	// 			const data = await response.json();
	// 			if (!data.access_token) {
	// 				window.showErrorMessage('No access token received');
	// 			}
	// 			panel?.webview.postMessage({
	// 				command: 'oauth2TokenResponse',
	// 				token: data.access_token,
	// 			});
	// 		} catch (error) {
	// 			panel?.webview.postMessage({
	// 				command: 'oauth2TokenResponse',
	// 				error: error instanceof Error ? error.message : 'Failed to generate token',
	// 			});
	// 		}
	// 		return;
	// 	}
	// case 'openFileInEditor': {
	// 	if (message.filePath) {
	// 		const fileUri = Uri.parse(message.filePath);
	// 		commands.executeCommand('vscode.open', fileUri);
	// 	}
	// 	return;
	// }
	// 	case 'webviewReady': {
	// 		console.log("🚀 ~ configureWebviewPanel ~  'webviewReady':", 'webviewReady');
	// 		const request = args?.[0];
	// 		const collection = args?.[1];
	// 		sendThemeDataToWebview(panel);
	// 		panel.webview.postMessage({
	// 			command: 'initialize',
	// 			data: {
	// 				tabId,
	// 				request: request?.request || null,
	// 				collection: collection?.id,
	// 			},
	// 		});
	// 		const collections = collectionService.getAllCollections();

	// 		panel.webview.postMessage({
	// 			command: 'setCollections',
	// 			data: collections,
	// 		});
	// 		return;
	// 	}
	// 	case 'createCollection': {
	// 		if (message.name) {
	// 			const newCollection = collectionService.createCollection(message.name);
	// 			saveApplicationState();
	// 			collectionsProvider.refresh();
	// 			panel?.webview.postMessage({
	// 				command: 'addCollection',
	// 				data: newCollection,
	// 			});
	// 			window.showInformationMessage(`Collection '${message.name}' created.`);
	// 		}
	// 		return;
	// 	}
	// 	case 'saveRequest': {
	// 		const { collectionId, requestId, request } = message.payload;
	// 		if (requestId) {
	// 			collectionService.updateRequest(collectionId, requestId, request);
	// 		} else {
	// 			collectionService.createRequest(collectionId, request);
	// 		}
	// 		saveApplicationState();
	// 		collectionsProvider.refresh();
	// 		window.showInformationMessage(`Request '${request.name}' saved to collection.`);
	// 		return;
	// 	}
	// 	case 'formDataFileRequest': {
	// 		const options: OpenDialogOptions = {
	// 			canSelectMany: true,
	// 			openLabel: 'Select File',
	// 		};
	// 		window.showOpenDialog(options).then(fileUris => {
	// 			if (fileUris && fileUris.length > 0) {
	// 				const paths = fileUris.map(uri => uri.fsPath);
	// 				panel?.webview.postMessage({
	// 					command: 'formDataFileResponse',
	// 					paths: paths,
	// 					index: message.index,
	// 				});
	// 			}
	// 		});
	// 		return;
	// 	}
	// 	case 'binaryFileRequest': {
	// 		const options: OpenDialogOptions = {
	// 			canSelectMany: false,
	// 			openLabel: 'Select File',
	// 		};
	// 		window.showOpenDialog(options).then(fileUris => {
	// 			if (fileUris && fileUris.length > 0) {
	// 				const filePath = fileUris[0].fsPath;
	// 				const stats = fs.statSync(filePath);
	// 				const contentType = lookup(filePath) || 'application/octet-stream';
	// 				panel?.webview.postMessage({
	// 					command: 'binaryFileResponse',
	// 					path: filePath,
	// 					size: stats.size,
	// 					contentType,
	// 				});
	// 			}
	// 		});
	// 		return;
	// 	}
	// 	case 'sendRequest': {
	// 		let historyItem: HistoryItem;
	// 		let requestHeaders: Record<string, string>;
	// 		let requestBody: any;
	// 		try {
	// 			let url = message.url;
	// 			let params;
	// 			if (message.params && Object.keys(message.params).length > 0) {
	// 				params = new URLSearchParams(Object.entries(message.params)).toString();
	// 				url = `${url}?${params}`;
	// 			}

	// 			const options: RequestInit = {
	// 				method: message.method,
	// 				headers: (message.headers as Record<string, string>) || {},
	// 			};
	// 			requestHeaders = { ...options.headers } as Record<string, string>;

	// 			const { bodyConfig } = message;
	// 			if (!bodyConfig) {
	// 				return;
	// 			}

	// 			if (bodyConfig.type === 'form-data') {
	// 				const form = new FormData();

	// 				for (const field of bodyConfig.formData) {
	// 					if (field.checked && field.key) {
	// 						if (field.type === 'text') {
	// 							form.append(field.key, field.value);
	// 						} else if (field.type === 'file' && field.value) {
	// 							const filePath = field.value;
	// 							const contentType = lookup(filePath) || 'application/octet-stream';
	// 							form.append(field.key, fs.createReadStream(filePath), {
	// 								contentType,
	// 								filename: field.fileName || path.basename(filePath),
	// 							});
	// 						}
	// 					}
	// 				}
	// 				const contentLength = await getFormLength(form);
	// 				options.body = requestBody = form;
	// 				options.headers = { ...options.headers, ...form.getHeaders(), 'Content-Length': contentLength.toString() };
	// 				requestHeaders = { ...options.headers } as Record<string, string>;
	// 			} else if (bodyConfig.type === 'x-www-form-urlencoded') {
	// 				params = new URLSearchParams();
	// 				for (const field of bodyConfig.urlEncoded) {
	// 					if (field.checked && field.key) {
	// 						params.append(field.key, field.value);
	// 					}
	// 				}
	// 				options.body = requestBody = params;
	// 				// Ensure the correct Content-Type header is set
	// 				(options.headers as Record<string, string>)['Content-Type'] = 'application/x-www-form-urlencoded';
	// 				requestHeaders = { ...options.headers } as Record<string, string>;
	// 			} else if (bodyConfig.type === 'binary' && bodyConfig.binary?.filePath) {
	// 				const filePath = bodyConfig.binary.filePath;
	// 				const stats = fs.statSync(filePath);
	// 				const headers = options.headers as Record<string, string>;
	// 				options.body = requestBody = fs.createReadStream(filePath);
	// 				headers['Content-Length'] = stats.size.toString();
	// 				if (!headers['Content-Type'] && !headers['content-type']) {
	// 					headers['Content-Type'] = bodyConfig.binary.contentType || 'application/octet-stream';
	// 				}
	// 				requestHeaders = { ...options.headers } as Record<string, string>;
	// 			} else if (bodyConfig.type === 'raw' && bodyConfig.raw?.content) {
	// 				// Your existing logic for raw body
	// 				options.body = requestBody = bodyConfig.raw.content;
	// 				const headers = options.headers as Record<string, string>;

	// 				// If Content-Type is not already set by the user, set it based on the raw body language.
	// 				if (!headers['Content-Type'] && !headers['content-type']) {
	// 					switch (bodyConfig.raw.language) {
	// 						case 'json':
	// 							headers['Content-Type'] = 'application/json';
	// 							break;
	// 						case 'xml':
	// 							headers['Content-Type'] = 'application/xml';
	// 							break;
	// 						case 'html':
	// 							headers['Content-Type'] = 'text/html';
	// 							break;
	// 						case 'javascript':
	// 							headers['Content-Type'] = 'application/javascript';
	// 							break;
	// 						case 'css':
	// 							headers['Content-Type'] = 'text/css';
	// 							break;
	// 						default:
	// 							headers['Content-Type'] = 'text/plain';
	// 							break;
	// 					}
	// 				}
	// 				requestHeaders = { ...options.headers } as Record<string, string>;
	// 			}
	// 			const startTime = Date.now();
	// 			console.log('Sending request to URL:', url, 'with options:', options);
	// 			const response = await fetch(url, options);
	// 			const responseTime = Date.now() - startTime;

	// 			const bodyBuffer = await response.buffer();

	// 			const SIZE_THRESHOLD_BYTES = 1 * 1024 * 1024;
	// 			let responseDataPayload;

	// 			if (bodyBuffer.length > SIZE_THRESHOLD_BYTES) {
	// 				const tempDir = context.storageUri || context.globalStorageUri;
	// 				if (!fs.existsSync(tempDir.fsPath)) {
	// 					fs.mkdirSync(tempDir.fsPath, { recursive: true });
	// 				}
	// 				const tempFileName = `response-${Date.now()}.tmp`;
	// 				const tempFileUri = Uri.joinPath(tempDir, tempFileName);

	// 				fs.writeFileSync(tempFileUri.fsPath, bodyBuffer);

	// 				responseDataPayload = {
	// 					status: response.status,
	// 					statusText: response.statusText,
	// 					headers: Object.fromEntries(response.headers.entries()),
	// 					responseTime,
	// 					size: bodyBuffer.length,
	// 					body: null,
	// 					isLargeBody: true,
	// 					bodyFilePath: tempFileUri.toString(), // Send the URI as a string
	// 				};

	// 				historyItem = {
	// 					historyId: Date.now().toString(),
	// 					request: {
	// 						url: message.url,
	// 						method: message.method,
	// 						headers: requestHeaders,
	// 						body: requestBody,
	// 						auth: message.auth,
	// 						params: message.params,
	// 					},
	// 					response: {
	// 						status: response.status,
	// 						statusText: response.statusText,
	// 						headers: Object.fromEntries(response.headers.entries()),
	// 						size: bodyBuffer.length,
	// 						isLargeBody: true,
	// 						bodyFilePath: tempFileUri.toString(),
	// 						isError: !response.ok,
	// 						error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
	// 						body: null,
	// 						contentType: response.headers.get('content-type') || '',
	// 						duration: responseTime,
	// 					},
	// 					timestamp: new Date(),
	// 					success: response.ok,
	// 					error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
	// 				};
	// 				historyService.addToHistory(historyItem);
	// 				saveApplicationState();
	// 				historyProvider.refresh();

	// 				panel.webview.postMessage({
	// 					command: 'apiResponse',
	// 					data: responseDataPayload,
	// 				});
	// 			} else {
	// 				// Handle different response types based on method and content
	// 				const body = bodyBuffer.toString('utf-8');
	// 				let data: any;
	// 				const contentType = response.headers.get('content-type') || '';
	// 				if (message.method.toUpperCase() === 'HEAD') {
	// 					// HEAD requests return no body, only headers
	// 					data = {
	// 						status: response.status,
	// 						statusText: response.statusText,
	// 						headers: Object.fromEntries(response.headers.entries()),
	// 						method: message.method,
	// 						url: response.url,
	// 						responseTime,
	// 					};
	// 				} else if (contentType.includes('application/json')) {
	// 					// JSON response
	// 					try {
	// 						data = {
	// 							status: response.status,
	// 							statusText: response.statusText,
	// 							headers: Object.fromEntries(response.headers.entries()),
	// 							body: JSON.parse(body),
	// 							method: message.method,
	// 							url: response.url,
	// 							responseTime,
	// 						};
	// 					} catch {
	// 						// If JSON parsing fails, treat as text
	// 						data = {
	// 							status: response.status,
	// 							statusText: response.statusText,
	// 							headers: Object.fromEntries(response.headers.entries()),
	// 							body: body,
	// 							method: message.method,
	// 							url: response.url,
	// 							responseTime,
	// 						};
	// 					}
	// 				} else {
	// 					// Non-JSON response (text, HTML, etc.)
	// 					data = {
	// 						status: response.status,
	// 						statusText: response.statusText,
	// 						headers: Object.fromEntries(response.headers.entries()),
	// 						body: body,
	// 						method: message.method,
	// 						url: response.url,
	// 						responseTime,
	// 					};
	// 				}

	// 				historyItem = {
	// 					historyId: Date.now().toString(),
	// 					request: {
	// 						url: message.url,
	// 						method: message.method,
	// 						headers: requestHeaders,
	// 						body: requestBody,
	// 						auth: message.auth,
	// 						params: message.params,
	// 					},
	// 					response: {
	// 						status: response.status,
	// 						statusText: response.statusText,
	// 						headers: Object.fromEntries(response.headers.entries()),
	// 						size: bodyBuffer.length,
	// 						isLargeBody: false,
	// 						bodyFilePath: undefined,
	// 						isError: !response.ok,
	// 						error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
	// 						body: response.ok ? data.body : null,
	// 						contentType: response.headers.get('content-type') || '',
	// 						duration: responseTime,
	// 					},
	// 					timestamp: new Date(),
	// 					success: response.ok,
	// 					error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
	// 				};
	// 				historyService.addToHistory(historyItem);
	// 				saveApplicationState();
	// 				historyProvider.refresh();

	// 				panel?.webview.postMessage({ command: 'apiResponse', data: data });
	// 			}
	// 		} catch (error: any) {
	// 			// Save error to history
	// 			historyItem = {
	// 				historyId: Date.now().toString(),
	// 				request: {
	// 					url: message.url,
	// 					method: message.method,
	// 					headers: {},
	// 					body: requestBody,
	// 					auth: message.auth,
	// 					params: message.params,
	// 				},
	// 				response: {
	// 					status: message.status,
	// 					statusText: message.statusText,
	// 					headers: Object.fromEntries(message.headers.entries()),
	// 					size: 0,
	// 					isLargeBody: true,
	// 					bodyFilePath: undefined,
	// 					isError: true,
	// 					error: error.message,
	// 					body: null,
	// 					contentType: '',
	// 					duration: 0,
	// 				},
	// 				timestamp: new Date(),
	// 				success: false,
	// 				error: error.message,
	// 			};
	// 			historyService.addToHistory(historyItem);
	// 			saveApplicationState();

	// 			window.showErrorMessage(`API Request Failed: ${error.message}`);
	// 			panel?.webview.postMessage({ command: 'apiResponse', data: { error: error.message } });
	// 		}
	// 		return;
	// 	}
	// }
	// 			await messageRouter.route(message, panel);
	// 		},
	// 		undefined,
	// 		context.subscriptions
	// 	);

	// 	const webviewUri = Uri.joinPath(context.extensionUri, 'dist', 'webview.js');
	// 	panel.webview.html = getWebviewContent(panel.webview, webviewUri);
	// }
}

// function saveApplicationState() {
// 	const state = {
// 		collections: collectionService.exportData(),
// 		history: historyService.exportData(),
// 		environments: environmentService.exportData(),
// 	};
// 	storageService.saveState(state);
// }

// function getWebviewContent(webview: Webview, webviewUri: Uri) {
// 	const nonce = getNonce();
// 	const styleUri = webview.asWebviewUri(Uri.joinPath(webviewUri, '..', 'main.css'));
// 	return `<!DOCTYPE html>
// 	  <html lang="en">
// 	  <head>
// 		  <meta charset="UTF-8">
// 		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
// 			<meta http-equiv="Content-Security-Policy" content="default-src 'none';
// 				img-src ${webview.cspSource} https: data:;
// 				style-src ${webview.cspSource} 'unsafe-inline' data:;
// 				script-src 'nonce-${nonce}';
// 				font-src ${webview.cspSource};
// 				worker-src ${webview.cspSource} blob:;
// 				connect-src ${webview.cspSource};">
// 		  <link href="${styleUri}" rel="stylesheet">
// 		  <title>API Client</title>
// 	  </head>
// 	  <body>
// 			<noscript>You need to enable JavaScript to run this app.</noscript>
// 		  <div id="root"></div>
// 		  <script nonce="${nonce}" type="module" src="${webview.asWebviewUri(webviewUri)}"></script>
// 	  </body>
// 	  </html>`;
// }

// function getNonce() {
// 	let text = '';
// 	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
// 	for (let i = 0; i < 32; i++) {
// 		text += possible.charAt(Math.floor(Math.random() * possible.length));
// 	}
// 	return text;
// }

export function deactivate() {
	StateManager.flush();
}

