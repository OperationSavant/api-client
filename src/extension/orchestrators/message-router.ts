import { WebviewPanel } from 'vscode';
import { ApplicationServices } from '../services/application-services';
import { RequestHandler } from '../handlers/request-handler';
import { InitializeHandler } from '../handlers/initialize-handler';
import { FileHandler } from '../handlers/file-handler';
import { OAuth2Handler } from '../handlers/oauth2-handler';
import { CollectionHandler } from '../handlers/collection-handler';
import { EnvironmentHandler } from '../handlers/environment-handler';
import { HistoryHandler } from '../handlers/history-handler';
import { WebviewMessage } from '@/shared/types/webview-messages';

export class MessageRouter {
	private requestHandler: RequestHandler;
	private initializeHandler: InitializeHandler;
	private fileHandler: FileHandler;
	private oauth2Handler: OAuth2Handler;
	private collectionHandler: CollectionHandler;
	private environmentHandler: EnvironmentHandler;
	private historyHandler: HistoryHandler;

	constructor(private services: ApplicationServices) {
		this.requestHandler = new RequestHandler({
			requestExecutor: services.requestExecutor,
			historyService: services.history,
		});
		this.initializeHandler = new InitializeHandler({
			collectionService: services.collections,
			environmentService: services.environment,
			historyService: services.history,
		});
		this.fileHandler = new FileHandler();
		this.oauth2Handler = new OAuth2Handler();
		this.collectionHandler = new CollectionHandler({ collectionService: services.collections });
		this.environmentHandler = new EnvironmentHandler({ environmentService: services.environment });
		this.historyHandler = new HistoryHandler({ historyService: services.history });
	}

	/**
	 * Route message to appropriate handler
	 */
	async route(message: WebviewMessage, panel: WebviewPanel): Promise<void> {
		switch (message.command) {
			case 'webviewReady':
				return this.initializeHandler.handle(message, panel);

			case 'sendRequest':
				return this.requestHandler.handle(message, panel);

			case 'startOAuth2Authorization':
			case 'exchangeOAuth2Code':
			case 'generateOAuth2Token':
			case 'requestDeviceCode':
				return this.oauth2Handler.handle(message, panel);

			case 'formDataFileRequest':
				return this.fileHandler.handleFormDataFileSelect(message, panel);

			case 'binaryFileRequest':
				return this.fileHandler.handleBinaryFileSelect(message, panel);

			case 'openFileInEditor':
				return this.fileHandler.handleOpenFileInEditor(message, panel);

			case 'createCollection':
				return this.collectionHandler.handleCreateCollection(message, panel);

			case 'saveRequest':
				return this.collectionHandler.handleSaveRequest(message, panel);

			case 'updateCollection':
				return this.collectionHandler.handleUpdateCollection(message, panel);

			case 'deleteCollection':
				return this.collectionHandler.handleDeleteCollection(message, panel);

			case 'deleteRequest':
				return this.collectionHandler.handleDeleteRequest(message, panel);

			case 'updateRequest':
				return this.collectionHandler.handleUpdateRequest(message, panel);

			case 'reorderRequests':
				return this.collectionHandler.handleReorderRequests(message, panel);

			case 'createEnvironment':
				return this.environmentHandler.handleCreateEnvironment(message, panel);

			case 'deleteEnvironment':
				return this.environmentHandler.handleDeleteEnvironment(message, panel);

			case 'setActiveEnvironment':
				return this.environmentHandler.handleSetActiveEnvironment(message, panel);

			case 'clearHistory':
				return this.historyHandler.handleClearHistory(message, panel);

			case 'deleteHistoryItem':
				return this.historyHandler.handleDeleteHistoryItem(message, panel);

			default: {
				const _exhaustive: never = message;
				console.warn('Unhandled message:', _exhaustive);
				return;
			}
		}
	}
}
