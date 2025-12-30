import { collectionService } from '@/domain/services/collectionService';
import { unitOfWork } from '@/domain/services/unit-of-work';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';
import type { MessageEnvelope } from '@/shared/types/webview-messages';
import type {
	Collection,
	CreateCollection,
	CreateFolder,
	CreateOrSaveRequest,
	DeleteCollection,
	DeleteFolder,
	DeleteRequest,
	UpdateCollection,
	UpdateFolder,
	UpdateRequest,
} from '@/shared/types/collection';
import { SERVER_COMMANDS } from '@/shared/constants/commands';

export class CollectionHandler {
	constructor() {}

	/**
	 * Create new collection
	 */
	async handleCreateCollection(message: MessageEnvelope): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.createCollection(message.payload as CreateCollection);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastSuccessToAllPanels(allCollections);
		} catch (error) {
			console.error('Failed to create collection:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastErrorToAllPanels(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Update collection metadata (name, description)
	 */
	async handleUpdateCollection(message: MessageEnvelope): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.updateCollection(message.payload as UpdateCollection);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastSuccessToAllPanels(allCollections);
		} catch (error) {
			console.error('Failed to update collection:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastErrorToAllPanels(`Failed to update collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Delete collection
	 */
	async handleDeleteCollection(message: MessageEnvelope): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.deleteCollection(message.payload as DeleteCollection);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastSuccessToAllPanels(allCollections);
		} catch (error) {
			console.error('Failed to delete collection:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastErrorToAllPanels(`Failed to delete collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async handleCreateFolder(message: MessageEnvelope): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.createFolder(message.payload as CreateFolder);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastSuccessToAllPanels(allCollections);
		} catch (error) {
			console.error('Failed to create folder:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastErrorToAllPanels(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async handleUpdateFolder(message: MessageEnvelope): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.updateFolder(message.payload as UpdateFolder);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastSuccessToAllPanels(allCollections);
		} catch (error) {
			console.error('Failed to update folder:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastErrorToAllPanels(`Failed to update folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async handleDeleteFolder(message: MessageEnvelope): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.deleteFolder(message.payload as DeleteFolder);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastSuccessToAllPanels(allCollections);
		} catch (error) {
			console.error('Failed to delete folder:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastErrorToAllPanels(`Failed to delete folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async handleCreateRequest(message: MessageEnvelope): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.createRequest(message.payload as CreateOrSaveRequest);
			// Commit to database (async)
			await unitOfWork.commit();
			const allCollections = collectionService.getAllCollections();
			this.broadcastSuccessToAllPanels(allCollections);
		} catch (error) {
			console.error('Failed to create request:', error);
			// Rollback in-memory changes
			unitOfWork.rollback();
			this.broadcastErrorToAllPanels(`Failed to create request: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Save request to collection
	 */
	async handleSaveRequest(message: MessageEnvelope): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.createRequest(message.payload as CreateOrSaveRequest);
			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastSuccessToAllPanels(allCollections);
		} catch (error) {
			console.error('Failed to save request:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastErrorToAllPanels(`Failed to save request: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Update request in collection
	 */
	async handleUpdateRequest(message: MessageEnvelope): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.updateRequest(message.payload as UpdateRequest);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastSuccessToAllPanels(allCollections);
		} catch (error) {
			console.error('Failed to update request:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastErrorToAllPanels(`Failed to update request: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Delete request from collection
	 */
	async handleDeleteRequest(message: MessageEnvelope): Promise<void> {
		try {
			// Domain operation (synchronous)
			collectionService.deleteRequest(message.payload as DeleteRequest);

			// Commit to database (async)
			await unitOfWork.commit();

			const allCollections = collectionService.getAllCollections();
			this.broadcastSuccessToAllPanels(allCollections);
		} catch (error) {
			console.error('Failed to delete request:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			this.broadcastErrorToAllPanels(`Failed to delete request: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private broadcastSuccessToAllPanels(data: Collection[]): void {
		broadcasterHub.broadcast({ command: SERVER_COMMANDS.SET_COLLECTIONS, data });
	}

	private broadcastErrorToAllPanels(message: string): void {
		broadcasterHub.broadcastException(message);
	}

	/**
	 * Reorder requests in collection (drag & drop)
	 */
	async handleReorderRequests(_: MessageEnvelope): Promise<void> {
		//TODO: Implement reorder requests later
		// const { collectionId, requestIds } = message;
		// this.deps.collectionService.reorderRequests(collectionId, requestIds);
		// StateManager.saveState();
		// panel.webview.postMessage({
		// 	command: 'collectionsUpdated',
		// 	collections: this.deps.collectionService.exportData(),
		// });
	}
}
