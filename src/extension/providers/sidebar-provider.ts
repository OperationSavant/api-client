import { Uri, WebviewView, WebviewViewProvider } from 'vscode';
import { WebviewContentBuilder } from '../services/webview-content-builder';
import { SidebarHandler } from '../handlers/sidebar-handler';

export class SidebarProvider implements WebviewViewProvider {
	private _view?: WebviewView;
	constructor(
		private readonly extensionUri: Uri,
		private readonly sidebarHandler: SidebarHandler
	) {}

	resolveWebviewView(webviewView: WebviewView) {
		this._view = webviewView;
		webviewView.title = 'API Client';
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [Uri.joinPath(this.extensionUri, 'dist')],
		};
		const webviewUri = Uri.joinPath(this.extensionUri, 'dist', 'sidebar.js');
		webviewView.webview.html = WebviewContentBuilder.buildHtml(webviewView.webview, webviewUri, 'sidebar-root');

		webviewView.webview.onDidReceiveMessage(async message => {
			await this.sidebarHandler.handle(message, webviewView);
			return;
		});
	}

	async notifyDataChange(data: { command: string; data: any }): Promise<void> {
		if (this._view) {
			this._view.webview.postMessage(data);
		}
	}
}
