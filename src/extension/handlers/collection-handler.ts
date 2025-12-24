import { WebviewPanel, window } from 'vscode';
import { collectionService } from '@/domain/services/collectionService';
import { unitOfWork } from '@/domain/services/unit-of-work';
import { StateManager } from '../services/state-manager';
import { SQLiteCollectionPersistence } from '../services/collection-persistence';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';

type webViewPanelMessage = {
	command: string;
	data?: any;
};

export class CollectionHandler {
	constructor() {}

	/**
	 * Create new collection
	 */
	async handleCreateCollection(message: any): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.createCollection(message.name, message.description);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastToAllPanels({ command: 'setCollections', data: allCollections });
		} catch (error) {
			console.error('Failed to create collection:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastToAllPanels({
				command: 'error',
				data: { message: `Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}` },
			});
			throw error;
		}
	}

	/**
	 * Update collection metadata (name, description)
	 */
	async handleUpdateCollection(message: any): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.updateCollection(message.collectionId, {
				name: message.name,
				description: message.description,
				variables: message.variables,
				auth: message.auth,
			});

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastToAllPanels({ command: 'setCollections', data: allCollections });
		} catch (error) {
			console.error('Failed to update collection:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastToAllPanels({
				command: 'error',
				data: { message: `Failed to update collection: ${error instanceof Error ? error.message : 'Unknown error'}` },
			});
			throw error;
		}
	}

	/**
	 * Delete collection
	 */
	async handleDeleteCollection(message: any): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.deleteCollection(message.collectionId);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastToAllPanels({ command: 'setCollections', data: allCollections });
		} catch (error) {
			console.error('Failed to delete collection:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastToAllPanels({
				command: 'error',
				data: { message: `Failed to delete collection: ${error instanceof Error ? error.message : 'Unknown error'}` },
			});
			throw error;
		}
	}

	async handleCreateFolder(message: any): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.createFolder(message?.payload?.collectionId, message?.payload?.name, message?.payload?.parentId, message?.payload?.description);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastToAllPanels({ command: 'setCollections', data: allCollections });
		} catch (error) {
			console.error('Failed to create folder:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastToAllPanels({
				command: 'error',
				data: { message: `Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}` },
			});
			throw error;
		}
	}

	async handleUpdateFolder(message: any): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.updateFolder(message.collectionId, message.folderId, {
				name: message.name,
				description: message.description,
				parentId: message.parentId,
				variables: message.variables,
				auth: message.auth,
			});

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastToAllPanels({ command: 'setCollections', data: allCollections });
		} catch (error) {
			console.error('Failed to update folder:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastToAllPanels({
				command: 'error',
				data: { message: `Failed to update folder: ${error instanceof Error ? error.message : 'Unknown error'}` },
			});
			throw error;
		}
	}

	async handleDeleteFolder(message: any): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.deleteFolder(message.collectionId, message.folderId);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastToAllPanels({ command: 'setCollections', data: allCollections });
		} catch (error) {
			console.error('Failed to delete folder:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastToAllPanels({
				command: 'error',
				data: { message: `Failed to delete folder: ${error instanceof Error ? error.message : 'Unknown error'}` },
			});
			throw error;
		}
	}

	/**
	 * Save request to collection
	 */
	async handleSaveRequest(message: any): Promise<void> {
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

		const { requestId } = message?.payload;

		try {
			if (requestId) {
				await this.handleUpdateRequest(message?.payload);
			} else {
				// Domain operation (synchronous)
				collectionService.createRequest(message?.payload?.collectionId, message.payload?.request, message.payload?.folderId);

				// Commit to database (async)
				await unitOfWork.commit();
			}

			const allCollections = collectionService.getAllCollections();
			this.broadcastToAllPanels({ command: 'setCollections', data: allCollections });
		} catch (error) {
			console.error('Failed to save request:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastToAllPanels({
				command: 'error',
				data: { message: `Failed to save request: ${error instanceof Error ? error.message : 'Unknown error'}` },
			});
			throw error;
		}
	}

	/**
	 * Update request in collection
	 */
	async handleUpdateRequest(message: any): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.updateRequest(message.collectionId, message.requestId, {
				name: message?.request?.name,
				description: message?.request?.description,
				method: message?.request?.method,
				url: message?.request?.url,
				headers: message?.request?.headers,
				params: message?.request?.params,
				body: message?.request?.body,
				auth: message?.request?.auth,
				tests: message?.request?.tests,
				folderId: message?.request?.folderId,
				operationName: message?.request?.operationName,
			});

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastToAllPanels({ command: 'setCollections', data: allCollections });
		} catch (error) {
			console.error('Failed to update request:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastToAllPanels({
				command: 'error',
				data: { message: `Failed to update request: ${error instanceof Error ? error.message : 'Unknown error'}` },
			});
			throw error;
		}
	}

	/**
	 * Delete request from collection
	 */
	async handleDeleteRequest(message: any): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.deleteRequest(message.collectionId, message.requestId);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastToAllPanels({ command: 'setCollections', data: allCollections });
		} catch (error) {
			console.error('Failed to delete request:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastToAllPanels({
				command: 'error',
				data: { message: `Failed to delete request: ${error instanceof Error ? error.message : 'Unknown error'}` },
			});
			throw error;
		}
	}

	private broadcastToAllPanels({ command, data }: webViewPanelMessage): void {
		broadcasterHub.broadcast({
			command,
			collections: [...data],
		});
	}

	/**
	 * Reorder requests in collection (drag & drop)
	 */
	async handleReorderRequests(message: any): Promise<void> {
		// const { collectionId, requestIds } = message;
		// this.deps.collectionService.reorderRequests(collectionId, requestIds);
		// StateManager.saveState();
		// panel.webview.postMessage({
		// 	command: 'collectionsUpdated',
		// 	collections: this.deps.collectionService.exportData(),
		// });
	}
}
