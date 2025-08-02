import * as vscode from 'vscode';
import fetch, { RequestInit } from 'node-fetch';
import { CollectionsTreeProvider } from './providers/collections-tree-provider';
import { HistoryTreeProvider } from './providers/history-tree-provider';
import { EnvironmentTreeProvider } from './providers/environment-tree-provider';
import { collectionService } from './services/collectionService';
import { historyService } from './services/history-service';
import { environmentService } from './services/environment-service';

export function activate(context: vscode.ExtensionContext) {
	// Initialize tree providers
	const collectionsProvider = new CollectionsTreeProvider();
	const historyProvider = new HistoryTreeProvider();
	const environmentProvider = new EnvironmentTreeProvider();

	// Register tree views
	vscode.window.createTreeView('apiClient.collections', {
		treeDataProvider: collectionsProvider,
		showCollapseAll: true,
	});

	vscode.window.createTreeView('apiClient.history', {
		treeDataProvider: historyProvider,
		showCollapseAll: true,
	});

	vscode.window.createTreeView('apiClient.environment', {
		treeDataProvider: environmentProvider,
		showCollapseAll: true,
	});

	// Register commands
	context.subscriptions.push(
		// Main API Client command
		vscode.commands.registerCommand('apiClient.openRequest', (...args) => {
			openApiClientWebview(context, args);
		}),

		// Collection commands
		vscode.commands.registerCommand('apiClient.createCollection', async () => {
			const name = await vscode.window.showInputBox({
				prompt: 'Enter collection name',
				placeHolder: 'My Collection',
			});
			if (name) {
				const description = await vscode.window.showInputBox({
					prompt: 'Enter collection description (optional)',
					placeHolder: 'Description',
				});
				collectionService.createCollection(name, description || undefined);
				collectionsProvider.refresh();
			}
		}),

		vscode.commands.registerCommand('apiClient.deleteCollection', async item => {
			if (item && item.collection) {
				const confirmation = await vscode.window.showWarningMessage(`Delete collection "${item.collection.name}"?`, { modal: true }, 'Delete');
				if (confirmation === 'Delete') {
					collectionService.deleteCollection(item.collection.id);
					collectionsProvider.refresh();
				}
			}
		}),

		vscode.commands.registerCommand('apiClient.createRequest', async item => {
			if (item && item.collection) {
				const name = await vscode.window.showInputBox({
					prompt: 'Enter request name',
					placeHolder: 'My Request',
				});
				if (name) {
					const request = {
						name,
						method: 'GET',
						url: '',
						headers: {},
						params: {},
						body: {
							type: 'none' as const,
							data: '',
						},
						auth: undefined,
					};
					collectionService.createRequest(item.collection.id, request);
					collectionsProvider.refresh();
				}
			}
		}),

		vscode.commands.registerCommand('apiClient.deleteRequest', async item => {
			if (item && item.request && item.collection) {
				const confirmation = await vscode.window.showWarningMessage(`Delete request "${item.request.name}"?`, { modal: true }, 'Delete');
				if (confirmation === 'Delete') {
					collectionService.deleteRequest(item.collection.id, item.request.id);
					collectionsProvider.refresh();
				}
			}
		}),

		vscode.commands.registerCommand('apiClient.refreshCollections', () => {
			collectionsProvider.refresh();
		}),

		// History commands
		vscode.commands.registerCommand('apiClient.clearHistory', async () => {
			const confirmation = await vscode.window.showWarningMessage('Clear all request history?', { modal: true }, 'Clear');
			if (confirmation === 'Clear') {
				historyService.clearHistory();
				historyProvider.refresh();
			}
		}),

		vscode.commands.registerCommand('apiClient.refreshHistory', () => {
			historyProvider.refresh();
		}),

		// Environment commands
		vscode.commands.registerCommand('apiClient.createEnvironment', async () => {
			const name = await vscode.window.showInputBox({
				prompt: 'Enter environment name',
				placeHolder: 'Development',
			});
			if (name) {
				const scopeType = await vscode.window.showQuickPick(['global', 'collection', 'request'], { placeHolder: 'Select scope type' });
				if (scopeType) {
					environmentService.createScope(name, scopeType as any);
					environmentProvider.refresh();
				}
			}
		}),

		vscode.commands.registerCommand('apiClient.deleteEnvironment', async item => {
			if (item && item.scope) {
				const confirmation = await vscode.window.showWarningMessage(`Delete environment "${item.scope.name}"?`, { modal: true }, 'Delete');
				if (confirmation === 'Delete') {
					environmentService.deleteScope(item.scope.id);
					environmentProvider.refresh();
				}
			}
		}),

		vscode.commands.registerCommand('apiClient.setActiveEnvironment', (scopeId: string) => {
			environmentService.setActiveScope(scopeId);
			environmentProvider.refresh();
		}),

		vscode.commands.registerCommand('apiClient.refreshEnvironment', () => {
			environmentProvider.refresh();
		})
	);

	function openApiClientWebview(context: vscode.ExtensionContext, args?: any[]) {
		const panel = vscode.window.createWebviewPanel('apiClient', 'API Client', vscode.ViewColumn.One, {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
		});

		// If args contain request data (from tree item click), send it to webview
		if (args && args.length > 0) {
			const requestData = args[0];
			// Send request data to webview after it loads
			setTimeout(() => {
				panel.webview.postMessage({
					command: 'loadRequest',
					data: requestData,
				});
			}, 1000);
		}

		panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.command) {
					case 'sendRequest':
						try {
							let url = message.url;
							if (message.params && Object.keys(message.params).length > 0) {
								const params = new URLSearchParams(Object.entries(message.params)).toString();
								console.log(`Params: ${params}`);
								url = `${url}?${params}`;
							}

							const options: RequestInit = {
								method: message.method,
								headers: (message.headers as Record<string, string>) || {},
							};

							if (typeof message.body === 'string' && message.body.length > 0) {
								options.body = message.body;
								const headers = options.headers as Record<string, string>;
								// Only set Content-Type if not already set by user headers
								if (!headers['Content-Type'] && !headers['content-type']) {
									headers['Content-Type'] = 'application/json';
								}
							}

							const startTime = Date.now();
							const response = await fetch(url, options);
							const responseTime = Date.now() - startTime;

							// Save to history
							const historyItem = {
								id: Date.now().toString(),
								url: message.url,
								method: message.method,
								timestamp: new Date(),
								status: response.status,
								statusText: response.statusText,
								responseTime,
								headers: message.headers,
								body: message.body,
								success: response.ok,
								error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
							};
							historyService.addToHistory(historyItem);
							historyProvider.refresh();

							// Handle different response types based on method and content
							let data: any;
							const contentType = response.headers.get('content-type') || '';

							if (message.method.toUpperCase() === 'HEAD') {
								// HEAD requests return no body, only headers
								data = {
									status: response.status,
									statusText: response.statusText,
									headers: Object.fromEntries(response.headers.entries()),
									method: message.method,
									url: response.url,
									responseTime,
								};
							} else if (contentType.includes('application/json')) {
								// JSON response
								try {
									const jsonData = await response.json();
									data = {
										status: response.status,
										statusText: response.statusText,
										headers: Object.fromEntries(response.headers.entries()),
										body: jsonData,
										method: message.method,
										url: response.url,
										responseTime,
									};
								} catch {
									// If JSON parsing fails, treat as text
									const textData = await response.text();
									data = {
										status: response.status,
										statusText: response.statusText,
										headers: Object.fromEntries(response.headers.entries()),
										body: textData,
										method: message.method,
										url: response.url,
										responseTime,
									};
								}
							} else {
								// Non-JSON response (text, HTML, etc.)
								const textData = await response.text();
								data = {
									status: response.status,
									statusText: response.statusText,
									headers: Object.fromEntries(response.headers.entries()),
									body: textData,
									method: message.method,
									url: response.url,
									responseTime,
								};
							}

							panel.webview.postMessage({ command: 'apiResponse', data: data });
						} catch (error: any) {
							// Save error to history
							const historyItem = {
								id: Date.now().toString(),
								url: message.url,
								method: message.method,
								timestamp: new Date(),
								headers: message.headers,
								body: message.body,
								success: false,
								error: error.message,
							};
							historyService.addToHistory(historyItem);
							historyProvider.refresh();

							vscode.window.showErrorMessage(`API Request Failed: ${error.message}`);
							panel.webview.postMessage({ command: 'apiResponse', data: { error: error.message } });
						}
						return;
				}
			},
			undefined,
			context.subscriptions
		);

		const webviewUri = vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview.js');
		panel.webview.html = getWebviewContent(panel.webview, webviewUri);
	}
}

function getWebviewContent(webview: vscode.Webview, webviewUri: vscode.Uri) {
	const nonce = getNonce();
	const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewUri, '..', 'webview.css'));
	return `<!DOCTYPE html>
	  <html lang="en">
	  <head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
		  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
				webview.cspSource
			} 'unsafe-inline' 'self' data:; script-src 'nonce-${nonce}';">
		  <link href="${styleUri}" rel="stylesheet">
		  <title>API Client</title>
	  </head>
	  <body>
		  <div id="root"></div>
		  <script nonce="${nonce}" type="module" src="${webview.asWebviewUri(webviewUri)}"></script>
	  </body>
	  </html>`;
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function deactivate() {}

