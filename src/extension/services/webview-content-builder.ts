import type { Webview } from 'vscode';
import { Uri } from 'vscode';

export class ContentBuilder {
	/**
	 * Generate HTML content for webview panel
	 * Includes CSP nonce for security and dynamic URI resolution
	 */
	static buildHtml(webview: Webview, webviewUri: Uri, rootId: string): string {
		const nonce = this.generateNonce();

		const styleUri = webview.asWebviewUri(Uri.joinPath(webviewUri, '..', 'main.css'));
		const scriptUri = webview.asWebviewUri(webviewUri);
		const additionalScripts: Uri[] = [];
		if (rootId === 'main-root') {
			additionalScripts.push(
				webview.asWebviewUri(Uri.joinPath(webviewUri, '..', 'build', 'pdf.worker.min.mjs')),
				webview.asWebviewUri(Uri.joinPath(webviewUri, '..', 'ts.worker.js')),
				webview.asWebviewUri(Uri.joinPath(webviewUri, '..', 'css.worker.js')),
				webview.asWebviewUri(Uri.joinPath(webviewUri, '..', 'html.worker.js')),
				webview.asWebviewUri(Uri.joinPath(webviewUri, '..', 'json.worker.js')),
				webview.asWebviewUri(Uri.joinPath(webviewUri, '..', 'editor.worker.js'))
			);
		}

		return this.html(nonce, webview, styleUri.toString(), scriptUri.toString(), rootId, additionalScripts);
	}

	private static html(nonce: string, webview: Webview, styleUri: string, scriptUri: string, rootId: string, additionalScripts: Uri[]): string {
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
				${additionalScripts.map(script => `<script nonce="${nonce}" type="module" src="${script}"></script>`).join('')}
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
