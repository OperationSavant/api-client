import type { WebviewPanel, WebviewView } from 'vscode';
import type { ApplicationServices } from '../services/application-services';
import { RequestHandler } from '../handlers/request-handler';
import { InitializeHandler } from '../handlers/initialize-handler';
import { FileHandler } from '../handlers/file-handler';
import { OAuth2Handler } from '../handlers/oauth2-handler';
import { CollectionHandler } from '../handlers/collection-handler';
import { EnvironmentHandler } from '../handlers/environment-handler';
import { HistoryHandler } from '../handlers/history-handler';
import type { WebviewMessage, WebviewViewMessage } from '@/shared/types/webview-messages';
import { SidebarHandler } from '../handlers/sidebar-handler';

type CommandHandler<T = unknown> = (payload: T) => Promise<void>;
interface WebviewRouteContext {
	message: WebviewMessage;
	target: WebviewPanel;
}

interface WebviewViewRouteContext {
	message: WebviewViewMessage;
	target: WebviewView;
}

export class MessageRouter {
	private requestHandler: RequestHandler;
	private initializeHandler: InitializeHandler;
	private fileHandler: FileHandler;
	private oauth2Handler: OAuth2Handler;
	private collectionHandler: CollectionHandler;
	private environmentHandler: EnvironmentHandler;
	private historyHandler: HistoryHandler;
	private sidebarHandler: SidebarHandler;

	private webviewHandlers: Record<string, CommandHandler<WebviewRouteContext>>;
	private webviewViewHandlers: Record<string, CommandHandler<WebviewViewRouteContext>>;

	constructor(private services: ApplicationServices) {
		this.requestHandler = new RequestHandler({ requestExecutor: services.requestExecutor });
		this.initializeHandler = new InitializeHandler();
		this.fileHandler = new FileHandler();
		this.oauth2Handler = new OAuth2Handler();
		this.collectionHandler = new CollectionHandler();
		this.environmentHandler = new EnvironmentHandler();
		this.historyHandler = new HistoryHandler();
		this.sidebarHandler = new SidebarHandler();

		this.webviewHandlers = {
			webviewReady: ({ message, target }) => this.initializeHandler.handle(message, target),

			sendRequest: ({ message, target }) => this.requestHandler.handle(message, target),

			startOAuth2Authorization: ctx => this.oauth2Handler.handle(ctx.message, ctx.target),
			exchangeOAuth2Code: ctx => this.oauth2Handler.handle(ctx.message, ctx.target),
			generateOAuth2Token: ctx => this.oauth2Handler.handle(ctx.message, ctx.target),
			requestDeviceCode: ctx => this.oauth2Handler.handle(ctx.message, ctx.target),

			formDataFileRequest: ({ message, target }) => this.fileHandler.handleFormDataFileSelect(message, target),

			binaryFileRequest: ({ message, target }) => this.fileHandler.handleBinaryFileSelect(message, target),

			openFileInEditor: ({ message, target }) => this.fileHandler.handleOpenFileInEditor(message, target),

			createCollection: ({ message }) => this.collectionHandler.handleCreateCollection(message),

			saveRequest: ({ message }) => this.collectionHandler.handleSaveRequest(message),

			updateCollection: ({ message }) => this.collectionHandler.handleUpdateCollection(message),

			deleteCollection: ({ message }) => this.collectionHandler.handleDeleteCollection(message),

			deleteRequest: ({ message }) => this.collectionHandler.handleDeleteRequest(message),

			updateRequest: ({ message }) => this.collectionHandler.handleUpdateRequest(message),

			reorderRequests: ({ message }) => this.collectionHandler.handleReorderRequests(message),

			createEnvironment: ({ message, target }) => this.environmentHandler.handleCreateEnvironment(message, target),

			deleteEnvironment: ({ message, target }) => this.environmentHandler.handleDeleteEnvironment(message, target),

			setActiveEnvironment: ({ message, target }) => this.environmentHandler.handleSetActiveEnvironment(message, target),
			clearHistory: ({ message, target }) => this.historyHandler.handleClearHistory(message, target),

			deleteHistoryItem: ({ message, target }) => this.historyHandler.handleDeleteHistoryItem(message, target),
		};

		this.webviewViewHandlers = {
			createNewRequest: ctx => this.sidebarHandler.handle(ctx.message, ctx.target),
			openRequest: ctx => this.sidebarHandler.handle(ctx.message, ctx.target),
			sidebarReady: ctx => this.sidebarHandler.handle(ctx.message, ctx.target),
			refreshSidebar: ctx => this.sidebarHandler.handle(ctx.message, ctx.target),
			openCollectionView: ctx => this.sidebarHandler.handle(ctx.message, ctx.target),
			createCollection: ({ message }) => this.collectionHandler.handleCreateCollection(message),

			createFolder: ({ message }) => this.collectionHandler.handleCreateFolder(message),

			saveRequest: ({ message }) => this.collectionHandler.handleSaveRequest(message),
		};
	}

	async route(message: WebviewMessage | WebviewViewMessage, target: WebviewPanel | WebviewView): Promise<void> {
		if (message.source === 'webview' && 'reveal' in target) {
			const handler = this.webviewHandlers[message.command];
			if (!handler) throw new Error(`Unhandled command: ${message.command}`);

			return handler({ message, target });
		}

		if (message.source === 'webviewView' && 'show' in target) {
			const handler = this.webviewViewHandlers[message.command];
			if (!handler) throw new Error(`Unhandled command: ${message.command}`);

			return handler({ message, target });
		}
	}
}
