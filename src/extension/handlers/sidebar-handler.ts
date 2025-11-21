import { WebviewViewMessage } from '@/shared/types/webview-messages';
import { commands, WebviewView } from 'vscode';
import { SQLiteCollectionPersistence } from '../services/collection-persistence';

interface SidebarHandlerDependencies {
	collectionPersistence: SQLiteCollectionPersistence;
}

export class SidebarHandler {
	constructor(private deps: SidebarHandlerDependencies) {}

	async handle(message: WebviewViewMessage, webviewView: WebviewView): Promise<void> {
		switch (message.command) {
			case 'executeCommand':
				await commands.executeCommand(message.commandId, ...(message.args || []));
				break;

			case 'sidebarReady':
			case 'refreshSidebar':
				this.sendInitialData(webviewView);
				break;
		}
	}

	private sendInitialData(webviewView: WebviewView): void {
		try {
			const collections = this.deps!.collectionPersistence.loadAll();
			// TODO: Add methods for environments and history

			webviewView.webview.postMessage({
				command: 'initializeData',
				collections,
				environments: [],
				history: [],
			});
		} catch (error) {
			console.error('Error sending initial data to sidebar:', error);

			webviewView.webview.postMessage({
				command: 'initializeData',
				collections: [],
				environments: [],
				history: [],
			});
		}
	}
}
