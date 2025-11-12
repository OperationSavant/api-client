import { Webview, Uri } from 'vscode';

export class WebviewContentBuilder {
	/**
	 * Generate HTML content for webview panel
	 * Includes CSP nonce for security and dynamic URI resolution
	 */
	static buildHtml(webview: Webview, webviewUri: Uri, rootId: string): string {
		const nonce = this.generateNonce();

		const styleUri = webview.asWebviewUri(Uri.joinPath(webviewUri, '..', 'main.css'));
		const scriptUri = webview.asWebviewUri(webviewUri);

		return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none';
          img-src ${webview.cspSource} https: data:;
          style-src ${webview.cspSource} 'unsafe-inline' data:;
          script-src 'nonce-${nonce}' vscode-resource:;
          font-src ${webview.cspSource};
          worker-src ${webview.cspSource} blob: vscode-resource:;
          connect-src ${webview.cspSource};">
        <link href="${styleUri}" rel="stylesheet">
        <title>API Client</title>
      </head>
      <body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="${rootId}"></div>
        <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
      </body>
      </html>`;
	}

	/**
	 * Generate cryptographically random nonce for CSP
	 * 32-character alphanumeric string
	 */
	private static generateNonce(): string {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}
