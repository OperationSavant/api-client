import { WebviewPanel, window } from 'vscode';
import { collectionService } from '@/domain/services/collectionService';
import { StateManager } from '../services/state-manager';
import { SQLiteCollectionPersistence } from '../services/collection-persistence';

type webViewPanelMessage = {
	command: string;
	data?: any;
};

export class CollectionHandler {
	constructor() {}

	/**
	 * Create new collection
	 */
	async handleCreateCollection(message: any, panel: WebviewPanel): Promise<void> {
		// const name = message.name;

		// this.deps.collectionService.createCollection(name);

		// StateManager.saveState();

		// panel.webview.postMessage({
		// 	command: 'collectionsUpdated',
		// 	collections: this.deps.collectionService.exportData(),
		// });
		collectionService.createCollection(message.name, message.description);

		const allCollections = collectionService.getAllCollections();
		this.broadcastToAllPanels({ command: 'setCollections', data: allCollections }, panel);
	}

	/**
	 * Update collection metadata (name, description)
	 */
	async handleUpdateCollection(message: any, panel: WebviewPanel): Promise<void> {
		// const { collectionId, name, description } = message;

		// this.deps.collectionService.updateCollection(collectionId, { name, description });

		// StateManager.saveState();

		// panel.webview.postMessage({
		// 	command: 'collectionsUpdated',
		// 	collections: this.deps.collectionService.exportData(),
		// });
		collectionService.updateCollection(message.collectionId, {
			name: message.name,
			description: message.description,
			variables: message.variables,
			auth: message.auth,
		});

		const allCollections = collectionService.getAllCollections();
		this.broadcastToAllPanels({ command: 'setCollections', data: allCollections }, panel);
	}

	/**
	 * Delete collection
	 */
	async handleDeleteCollection(message: any, panel: WebviewPanel): Promise<void> {
		// const { collectionId } = message;

		// this.deps.collectionService.deleteCollection(collectionId);

		// StateManager.saveState();

		// panel.webview.postMessage({
		// 	command: 'collectionsUpdated',
		// 	collections: this.deps.collectionService.exportData(),
		// });
		collectionService.deleteCollection(message.collectionId);

		const allCollections = collectionService.getAllCollections();
		this.broadcastToAllPanels({ command: 'setCollections', data: allCollections }, panel);
	}

	async handleCreateFolder(message: any, panel: WebviewPanel): Promise<void> {
		collectionService.createFolder(message.collectionId, message.name, message.parentId, message.description);

		const allCollections = collectionService.getAllCollections();
		this.broadcastToAllPanels({ command: 'setCollections', data: allCollections }, panel);
	}

	async handleUpdateFolder(message: any, panel: WebviewPanel): Promise<void> {
		collectionService.updateFolder(message.collectionId, message.folderId, {
			name: message.name,
			description: message.description,
			parentId: message.parentId,
			variables: message.variables,
			auth: message.auth,
		});

		const allCollections = collectionService.getAllCollections();
		this.broadcastToAllPanels({ command: 'setCollections', data: allCollections }, panel);
	}

	async handleDeleteFolder(message: any, panel: WebviewPanel): Promise<void> {
		collectionService.deleteFolder(message.collectionId, message.folderId);

		const allCollections = collectionService.getAllCollections();
		this.broadcastToAllPanels({ command: 'setCollections', data: allCollections }, panel);
	}

	/**
	 * Save request to collection
	 */
	async handleSaveRequest(message: any, panel: WebviewPanel): Promise<void> {
		// const { collectionId, requestId, request } = message.payload;

		// if (requestId) {
		// 	this.deps.collectionService.updateRequest(collectionId, requestId, request);
		// } else {
		// 	this.deps.collectionService.createRequest(collectionId, request);
		// }

		// StateManager.saveState();

		// ✅ COMMENT OUT tree provider refresh (you'll replace with custom UI)
		// this.deps.collectionsProvider.refresh();

		// window.showInformationMessage(`Request '${request.name}' saved to collection.`);

		// ✅ COMMENT OUT webview message (you'll handle this in custom UI)
		// panel.webview.postMessage({
		//   command: 'addCollection',
		//   data: newCollection,
		// });

		const { collectionId, request, requestId } = message;

		if (requestId) {
			this.handleUpdateRequest(message, panel);
		} else {
			collectionService.createRequest(message.collectionId, message.request, message.folderId);
		}

		const allCollections = collectionService.getAllCollections();
		this.broadcastToAllPanels({ command: 'setCollections', data: allCollections }, panel);
	}

	/**
	 * Update request in collection
	 */
	async handleUpdateRequest(message: any, panel: WebviewPanel): Promise<void> {
		// const { collectionId, requestId, request } = message;

		// this.deps.collectionService.updateRequest(collectionId, requestId, request);

		// StateManager.saveState();

		// panel.webview.postMessage({
		// 	command: 'collectionsUpdated',
		// 	collections: this.deps.collectionService.exportData(),
		// });

		collectionService.updateRequest(message.collectionId, message.requestId, {
			name: message.name,
			description: message.description,
			method: message.method,
			url: message.url,
			headers: message.headers,
			params: message.params,
			body: message.body,
			auth: message.auth,
			tests: message.tests,
			folderId: message.folderId,
			operationName: message.operationName,
		});

		const allCollections = collectionService.getAllCollections();
		this.broadcastToAllPanels({ command: 'setCollections', data: allCollections }, panel);
	}

	/**
	 * Delete request from collection
	 */
	async handleDeleteRequest(message: any, panel: WebviewPanel): Promise<void> {
		// const { collectionId, requestId } = message;

		// this.deps.collectionService.deleteRequest(collectionId, requestId);

		// StateManager.saveState();

		// panel.webview.postMessage({
		// 	command: 'collectionsUpdated',
		// 	collections: this.deps.collectionService.exportData(),
		// });
		collectionService.deleteRequest(message.collectionId, message.requestId);

		const allCollections = collectionService.getAllCollections();
		this.broadcastToAllPanels({ command: 'setCollections', data: allCollections }, panel);
	}

	private broadcastToAllPanels({ command, data }: webViewPanelMessage, panel: WebviewPanel): void {
		panel.webview.postMessage({
			command,
			collections: { ...data },
		});
	}

	/**
	 * Reorder requests in collection (drag & drop)
	 */
	async handleReorderRequests(message: any, panel: WebviewPanel): Promise<void> {
		// const { collectionId, requestIds } = message;
		// this.deps.collectionService.reorderRequests(collectionId, requestIds);
		// StateManager.saveState();
		// panel.webview.postMessage({
		// 	command: 'collectionsUpdated',
		// 	collections: this.deps.collectionService.exportData(),
		// });
	}
}
