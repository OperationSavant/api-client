import { Uri, WebviewView, WebviewViewProvider } from 'vscode';
import { WebviewContentBuilder } from '../services/webview-content-builder';

export class SidebarProvider implements WebviewViewProvider {
	constructor(private readonly extensionUri: Uri) {}

	resolveWebviewView(webviewView: WebviewView) {
		webviewView.title = 'API Client';
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [Uri.joinPath(this.extensionUri, 'dist')],
		};
		const webviewUri = Uri.joinPath(this.extensionUri, 'dist', 'sidebar.js');
		webviewView.webview.html = WebviewContentBuilder.buildHtml(webviewView.webview, webviewUri, 'sidebar-root');
	}
}
