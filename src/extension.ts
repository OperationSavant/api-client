import * as vscode from 'vscode';
import fetch, { RequestInit } from 'node-fetch';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-api-client.start', () => {
			const panel = vscode.window.createWebviewPanel('apiClient', 'API Client', vscode.ViewColumn.One, {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
			});

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

								const response = await fetch(url, options);
								const data = await response.json();
								panel.webview.postMessage({ command: 'apiResponse', data: data });
							} catch (error: any) {
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
		})
	);
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
