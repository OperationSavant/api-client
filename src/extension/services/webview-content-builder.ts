import type { ExtensionContext, Webview } from 'vscode';
import { Uri } from 'vscode';
import { join } from 'path';
import { readFileSync } from 'fs';
import crypto from 'crypto';

export class ContentBuilder {
	/**
	 * Generate HTML content for webview panel
	 * Includes CSP nonce for security and dynamic URI resolution
	 */
	static buildHtml(webview: Webview, webviewUri: Uri, context: ExtensionContext, rootId: string): { html: string; previewUri: string } {
		const nonce = this.generateNonce();
		const styleUri = webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'dist', 'main.css'));
		const scriptUri = webview.asWebviewUri(webviewUri);
		const additionalScripts: Uri[] = [];
		if (rootId === 'main-root') {
			additionalScripts.push(
				webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'dist', 'build', 'pdf.worker.min.mjs')),
				webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'dist', 'ts.worker.js')),
				webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'dist', 'css.worker.js')),
				webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'dist', 'html.worker.js')),
				webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'dist', 'json.worker.js')),
				webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'dist', 'editor.worker.js'))
			);
		}

		const htmlPath = join(context.extensionPath, 'dist', 'preview', 'preview.html');
		const jsPath = join(context.extensionPath, 'dist', 'preview', 'preview-container.js');

		let html = readFileSync(htmlPath, 'utf8');
		const js = readFileSync(jsPath, 'utf8');

		const hash = crypto.createHash('sha256').update(js, 'utf8').digest('base64');

		html = html.replace('<script src="./preview-container.js"></script>', `<script>${js}</script>`);
		html = html.replace("script-src 'self'", `script-src 'self' 'sha256-${hash}'`);

		const previewUri = rootId === 'main-root' ? `data:text/html;charset=utf-8,${encodeURIComponent(html)}` : '';

		return { html: this.html(nonce, webview, styleUri.toString(), scriptUri.toString(), rootId, additionalScripts, hash), previewUri };
	}

	private static html(nonce: string, webview: Webview, styleUri: string, scriptUri: string, rootId: string, additionalScripts: Uri[], hash: string): string {
		return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none';
          img-src ${webview.cspSource} https: data:;
          style-src ${webview.cspSource} 'unsafe-inline';
          script-src 'nonce-${nonce}' 'sha256-${hash}';
					frame-src ${webview.cspSource} data:;
          font-src ${webview.cspSource};
          worker-src ${webview.cspSource} blob:;
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
