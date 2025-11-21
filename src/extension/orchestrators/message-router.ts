import { commands, Webview, WebviewPanel, WebviewView } from 'vscode';
import { ApplicationServices } from '../services/application-services';
import { RequestHandler } from '../handlers/request-handler';
import { InitializeHandler } from '../handlers/initialize-handler';
import { FileHandler } from '../handlers/file-handler';
import { OAuth2Handler } from '../handlers/oauth2-handler';
import { CollectionHandler } from '../handlers/collection-handler';
import { EnvironmentHandler } from '../handlers/environment-handler';
import { HistoryHandler } from '../handlers/history-handler';
import { WebviewMessage, WebviewViewMessage } from '@/shared/types/webview-messages';
import { SidebarHandler } from '../handlers/sidebar-handler';

/* eslint-disable no-dupe-class-members */
export class MessageRouter {
	private requestHandler: RequestHandler;
	private initializeHandler: InitializeHandler;
	private fileHandler: FileHandler;
	private oauth2Handler: OAuth2Handler;
	private collectionHandler: CollectionHandler;
	private environmentHandler: EnvironmentHandler;
	private historyHandler: HistoryHandler;
	private sidebarHandler: SidebarHandler;

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
		this.collectionHandler = new CollectionHandler();
		this.environmentHandler = new EnvironmentHandler({ environmentService: services.environment });
		this.historyHandler = new HistoryHandler({ historyService: services.history });
		this.sidebarHandler = new SidebarHandler({ collectionPersistence: services.collectionPersistence });
	}

	/**
	 * Route message to appropriate handler
	 */
	async route(message: WebviewMessage, panel: WebviewPanel): Promise<void>;

	async route(message: WebviewViewMessage, host: WebviewView): Promise<void>;

	async route(message: WebviewMessage | WebviewViewMessage, target: WebviewPanel | WebviewView): Promise<void> {
		if ('reveal' in target && message.source === 'webview') {
			switch (message.command) {
				case 'webviewReady':
					return this.initializeHandler.handle(message, target);

				case 'sendRequest':
					return this.requestHandler.handle(message, target);

				case 'startOAuth2Authorization':
				case 'exchangeOAuth2Code':
				case 'generateOAuth2Token':
				case 'requestDeviceCode':
					return this.oauth2Handler.handle(message, target);

				case 'formDataFileRequest':
					return this.fileHandler.handleFormDataFileSelect(message, target);

				case 'binaryFileRequest':
					return this.fileHandler.handleBinaryFileSelect(message, target);

				case 'openFileInEditor':
					return this.fileHandler.handleOpenFileInEditor(message, target);

				case 'createCollection':
					return this.collectionHandler.handleCreateCollection(message, target);

				case 'saveRequest':
					return this.collectionHandler.handleSaveRequest(message, target);

				case 'updateCollection':
					return this.collectionHandler.handleUpdateCollection(message, target);

				case 'deleteCollection':
					return this.collectionHandler.handleDeleteCollection(message, target);

				case 'deleteRequest':
					return this.collectionHandler.handleDeleteRequest(message, target);

				case 'updateRequest':
					return this.collectionHandler.handleUpdateRequest(message, target);

				case 'reorderRequests':
					return this.collectionHandler.handleReorderRequests(message, target);

				case 'createEnvironment':
					return this.environmentHandler.handleCreateEnvironment(message, target);

				case 'deleteEnvironment':
					return this.environmentHandler.handleDeleteEnvironment(message, target);

				case 'setActiveEnvironment':
					return this.environmentHandler.handleSetActiveEnvironment(message, target);

				case 'clearHistory':
					return this.historyHandler.handleClearHistory(message, target);

				case 'deleteHistoryItem':
					return this.historyHandler.handleDeleteHistoryItem(message, target);
			}
		} else if ('show' in target && message.source === 'webviewView') {
			switch (message.command) {
				case 'executeCommand':
				case 'sidebarReady':
				case 'refreshSidebar':
					await this.sidebarHandler.handle(message, target);
					break;
			}
		}
	}
}
/* eslint-disable no-dupe-class-members */
