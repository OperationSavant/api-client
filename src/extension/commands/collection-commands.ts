import type { WebviewPanel } from 'vscode';
import { window } from 'vscode';
import { collectionService } from '@/domain/services/collectionService';
import { unitOfWork } from '@/domain/services/unit-of-work';
import { v4 as uuidv4 } from 'uuid';
import type { SidebarProvider } from '../providers/sidebar-provider';

interface CollectionCommandDependencies {
	saveState: () => void;
	// refreshProvider: () => void;
	createWebview: (tabId: string, name?: string, args?: any[]) => WebviewPanel;
	getAllPanels: () => Map<string, WebviewPanel>;
	sidebarProvider?: SidebarProvider;
}

export class CollectionCommands {
	constructor(
		private deps: CollectionCommandDependencies & {
			sidebarProvider?: SidebarProvider;
		}
	) {}

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

		try {
			// Domain operation (synchronous)
			collectionService.createCollection(name, description || undefined);

			// Commit to database (async)
			await unitOfWork.commit();

			const panels = this.deps.getAllPanels();
			panels.forEach(panel => {
				panel.webview.postMessage({
					command: 'setCollections',
					data: collectionService.getAllCollections(),
				});
			});

			window.showInformationMessage(`Collection '${name}' created.`);
		} catch (error) {
			console.error('Failed to create collection:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			window.showErrorMessage(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Command: apiClient.deleteCollection
	 * Shows confirmation → deletes collection → refreshes UI
	 */
	async deleteCollection(item: any): Promise<void> {
		if (!item || !item.collection) return;

		const confirmation = await window.showWarningMessage(`Delete collection "${item.collection.name}"?`, { modal: true }, 'Delete');

		if (confirmation !== 'Delete') return;

		try {
			// Domain operation (synchronous)
			collectionService.deleteCollection(item.collection.id);

			// Commit to database (async)
			await unitOfWork.commit();

			window.showInformationMessage(`Collection '${item.collection.name}' deleted.`);
		} catch (error) {
			console.error('Failed to delete collection:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			window.showErrorMessage(`Failed to delete collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
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

		try {
			// Domain operation (synchronous)
			collectionService.deleteRequest(item.collection.id, item.request.id);

			// Commit to database (async)
			await unitOfWork.commit();

			window.showInformationMessage(`Request '${item.request.name}' deleted.`);
		} catch (error) {
			console.error('Failed to delete request:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			window.showErrorMessage(`Failed to delete request: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Command: apiClient.refreshCollections
	 * Manually refresh collections tree view
	 */
	refresh(): void {
		// this.deps.refreshProvider();
	}
}
