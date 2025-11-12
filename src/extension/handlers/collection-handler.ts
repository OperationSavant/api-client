import { WebviewPanel, window } from 'vscode';
import { collectionService } from '@/domain/services/collectionService';
import { StateManager } from '../services/state-manager';

interface CollectionHandlerDependencies {
	collectionService: typeof collectionService;
}

export class CollectionHandler {
	constructor(private deps: CollectionHandlerDependencies) {}

	/**
	 * Create new collection
	 */
	async handleCreateCollection(message: any, panel: WebviewPanel): Promise<void> {
		const name = message.name;

		this.deps.collectionService.createCollection(name);

		StateManager.saveState();

		panel.webview.postMessage({
			command: 'collectionsUpdated',
			collections: this.deps.collectionService.exportData(),
		});
	}

	/**
	 * Save request to collection
	 */
	async handleSaveRequest(message: any, panel: WebviewPanel): Promise<void> {
		const { collectionId, requestId, request } = message.payload;

		if (requestId) {
			this.deps.collectionService.updateRequest(collectionId, requestId, request);
		} else {
			this.deps.collectionService.createRequest(collectionId, request);
		}

		StateManager.saveState();

		// ✅ COMMENT OUT tree provider refresh (you'll replace with custom UI)
		// this.deps.collectionsProvider.refresh();

		window.showInformationMessage(`Request '${request.name}' saved to collection.`);

		// ✅ COMMENT OUT webview message (you'll handle this in custom UI)
		// panel.webview.postMessage({
		//   command: 'addCollection',
		//   data: newCollection,
		// });
	}

	/**
	 * Update collection metadata (name, description)
	 */
	async handleUpdateCollection(message: any, panel: WebviewPanel): Promise<void> {
		const { collectionId, name, description } = message;

		this.deps.collectionService.updateCollection(collectionId, { name, description });

		StateManager.saveState();

		panel.webview.postMessage({
			command: 'collectionsUpdated',
			collections: this.deps.collectionService.exportData(),
		});
	}

	/**
	 * Delete collection
	 */
	async handleDeleteCollection(message: any, panel: WebviewPanel): Promise<void> {
		const { collectionId } = message;

		this.deps.collectionService.deleteCollection(collectionId);

		StateManager.saveState();

		panel.webview.postMessage({
			command: 'collectionsUpdated',
			collections: this.deps.collectionService.exportData(),
		});
	}

	/**
	 * Delete request from collection
	 */
	async handleDeleteRequest(message: any, panel: WebviewPanel): Promise<void> {
		const { collectionId, requestId } = message;

		this.deps.collectionService.deleteRequest(collectionId, requestId);

		StateManager.saveState();

		panel.webview.postMessage({
			command: 'collectionsUpdated',
			collections: this.deps.collectionService.exportData(),
		});
	}

	/**
	 * Update request in collection
	 */
	async handleUpdateRequest(message: any, panel: WebviewPanel): Promise<void> {
		const { collectionId, requestId, request } = message;

		this.deps.collectionService.updateRequest(collectionId, requestId, request);

		StateManager.saveState();

		panel.webview.postMessage({
			command: 'collectionsUpdated',
			collections: this.deps.collectionService.exportData(),
		});
	}

	/**
	 * Reorder requests in collection (drag & drop)
	 */
	async handleReorderRequests(message: any, panel: WebviewPanel): Promise<void> {
		const { collectionId, requestIds } = message;

		// this.deps.collectionService.reorderRequests(collectionId, requestIds);

		StateManager.saveState();

		panel.webview.postMessage({
			command: 'collectionsUpdated',
			collections: this.deps.collectionService.exportData(),
		});
	}
}
