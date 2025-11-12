import { window, WebviewPanel } from 'vscode';
import { collectionService } from '@/domain/services/collectionService';
import { v4 as uuidv4 } from 'uuid';

interface CollectionCommandDependencies {
	saveState: () => void;
	// refreshProvider: () => void;
	createWebview: (tabId: string, name?: string, args?: any[]) => WebviewPanel;
	getAllPanels: () => Map<string, WebviewPanel>;
}

export class CollectionCommands {
	constructor(private deps: CollectionCommandDependencies) {}

	/**
	 * Command: apiClient.createCollection
	 * Shows input dialogs → creates collection → refreshes UI → notifies webviews
	 */
	async createCollection(): Promise<void> {
		const name = await window.showInputBox({
			prompt: 'Enter collection name',
			placeHolder: 'My Collection',
		});

		if (!name) return;

		const description = await window.showInputBox({
			prompt: 'Enter collection description (optional)',
			placeHolder: 'Description',
		});

		collectionService.createCollection(name, description || undefined);

		this.deps.saveState();

		// this.deps.refreshProvider();

		const panels = this.deps.getAllPanels();
		panels.forEach(panel => {
			panel.webview.postMessage({
				command: 'setCollections',
				data: collectionService.getAllCollections(),
			});
		});

		window.showInformationMessage(`Collection '${name}' created.`);
	}

	/**
	 * Command: apiClient.deleteCollection
	 * Shows confirmation → deletes collection → refreshes UI
	 */
	async deleteCollection(item: any): Promise<void> {
		if (!item || !item.collection) return;

		const confirmation = await window.showWarningMessage(`Delete collection "${item.collection.name}"?`, { modal: true }, 'Delete');

		if (confirmation !== 'Delete') return;

		collectionService.deleteCollection(item.collection.id);

		this.deps.saveState();

		// this.deps.refreshProvider();
	}

	/**
	 * Command: apiClient.createRequest
	 * Opens new webview panel for creating a request
	 */
	async createRequest(item?: any): Promise<void> {
		const tabId = uuidv4();

		const panel = this.deps.createWebview(tabId);

		this.deps.getAllPanels().set(tabId, panel);
	}

	/**
	 * Command: apiClient.deleteRequest
	 * Shows confirmation → deletes request from collection → refreshes UI
	 */
	async deleteRequest(item: any): Promise<void> {
		if (!item || !item.request || !item.collection) return;

		const confirmation = await window.showWarningMessage(`Delete request "${item.request.name}"?`, { modal: true }, 'Delete');

		if (confirmation !== 'Delete') return;

		collectionService.deleteRequest(item.collection.id, item.request.id);

		this.deps.saveState();

		// this.deps.refreshProvider();
	}

	/**
	 * Command: apiClient.refreshCollections
	 * Manually refresh collections tree view
	 */
	refresh(): void {
		// this.deps.refreshProvider();
	}
}
