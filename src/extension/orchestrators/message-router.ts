import type { WebviewPanel, WebviewView } from 'vscode';
import type { ApplicationServices } from '../services/application-services';
import { RequestHandler } from '../handlers/request-handler';
import { InitializeHandler } from '../handlers/initialize-handler';
import { FileHandler } from '../handlers/file-handler';
// import { OAuth2Handler } from '../handlers/oauth2-handler';
import { CollectionHandler } from '../handlers/collection-handler';
import { EnvironmentHandler } from '../handlers/environment-handler';
import { HistoryHandler } from '../handlers/history-handler';
import { SidebarHandler } from '../handlers/sidebar-handler';
import { CLIENT_COMMANDS } from '@/shared/constants/commands';
import type { ClientCommand, MessageEnvelope } from '@/shared/types/webview-messages';
import type { Request } from '@/shared/types/request';

type CommandHandler = (ctx: { message: MessageEnvelope; target: WebviewPanel | WebviewView }) => Promise<void>;

export class MessageRouter {
	private requestHandler: RequestHandler;
	private initializeHandler: InitializeHandler;
	private fileHandler: FileHandler;
	//TODO: Currently its totally broken. Need to revisit and re-implement OAuth2 flows.
	// private oauth2Handler: OAuth2Handler;
	private collectionHandler: CollectionHandler;
	private environmentHandler: EnvironmentHandler;
	private historyHandler: HistoryHandler;
	private sidebarHandler: SidebarHandler;

	// ---- SOURCE-SCOPED HANDLER MAPS ----
	private webviewHandlers: Partial<Record<ClientCommand, CommandHandler>>;
	private webviewViewHandlers: Partial<Record<ClientCommand, CommandHandler>>;

	constructor(services: ApplicationServices) {
		this.requestHandler = new RequestHandler({ requestExecutor: services.requestExecutor });
		this.initializeHandler = new InitializeHandler();
		this.fileHandler = new FileHandler();
		// this.oauth2Handler = new OAuth2Handler();
		this.collectionHandler = new CollectionHandler();
		this.environmentHandler = new EnvironmentHandler();
		this.historyHandler = new HistoryHandler();
		this.sidebarHandler = new SidebarHandler();

		// ---------- WEBVIEW (FULL CAPABILITY) ----------
		this.webviewHandlers = {
			[CLIENT_COMMANDS.WEBVIEW_READY]: ({ target }) => this.initializeHandler.handle(target as WebviewPanel),

			[CLIENT_COMMANDS.SEND_REQUEST]: ({ message: { payload } }) => this.requestHandler.handle(payload as Request),

			// [CLIENT_COMMANDS.START_OAUTH2_AUTHORIZATION]: ({ message }) => this.oauth2Handler.handle(message),

			// [CLIENT_COMMANDS.EXCHANGE_OAUTH2_CODE]: ({ message }) => this.oauth2Handler.handle(message),

			// [CLIENT_COMMANDS.GENERATE_OAUTH2_TOKEN]: ({ message }) => this.oauth2Handler.handle(message),

			// [CLIENT_COMMANDS.REQUEST_DEVICE_CODE]: ({ message }) => this.oauth2Handler.handle(message),

			[CLIENT_COMMANDS.FORM_DATA_FILE_REQUEST]: ({ message }) => this.fileHandler.handleFormDataFileSelect(message),

			[CLIENT_COMMANDS.BINARY_FILE_REQUEST]: () => this.fileHandler.handleBinaryFileSelect(),

			[CLIENT_COMMANDS.OPEN_FILE_IN_EDITOR]: ({ message }) => this.fileHandler.handleOpenFileInEditor(message),

			[CLIENT_COMMANDS.CREATE_COLLECTION]: ({ message }) => this.collectionHandler.handleCreateCollection(message),

			[CLIENT_COMMANDS.UPDATE_COLLECTION]: ({ message }) => this.collectionHandler.handleUpdateCollection(message),

			[CLIENT_COMMANDS.DELETE_COLLECTION]: ({ message }) => this.collectionHandler.handleDeleteCollection(message),

			[CLIENT_COMMANDS.SAVE_REQUEST]: ({ message }) => this.collectionHandler.handleSaveRequest(message),

			[CLIENT_COMMANDS.UPDATE_REQUEST]: ({ message }) => this.collectionHandler.handleUpdateRequest(message),

			[CLIENT_COMMANDS.REORDER_REQUESTS]: ({ message }) => this.collectionHandler.handleReorderRequests(message),

			[CLIENT_COMMANDS.CREATE_ENVIRONMENT]: ({ message }) => this.environmentHandler.handleCreateEnvironment(message),

			[CLIENT_COMMANDS.DELETE_ENVIRONMENT]: ({ message }) => this.environmentHandler.handleDeleteEnvironment(message),

			[CLIENT_COMMANDS.SET_ACTIVE_ENVIRONMENT]: ({ message }) => this.environmentHandler.handleSetActiveEnvironment(message),
		};

		// ---------- SIDEBAR (RESTRICTED CAPABILITY) ----------
		this.webviewViewHandlers = {
			[CLIENT_COMMANDS.SIDEBAR_READY]: ({ message }) => this.sidebarHandler.handle(message),

			[CLIENT_COMMANDS.REFRESH_SIDEBAR]: ({ message }) => this.sidebarHandler.handle(message),

			[CLIENT_COMMANDS.OPEN_COLLECTION_VIEW]: ({ message }) => this.sidebarHandler.handle(message),

			[CLIENT_COMMANDS.OPEN_REQUEST]: ({ message }) => this.sidebarHandler.handle(message),

			[CLIENT_COMMANDS.CREATE_REQUEST]: ({ message }) => this.sidebarHandler.handle(message),

			[CLIENT_COMMANDS.DELETE_REQUEST]: ({ message }) => this.collectionHandler.handleDeleteRequest(message),

			[CLIENT_COMMANDS.UPDATE_REQUEST]: ({ message }) => this.collectionHandler.handleUpdateRequest(message),

			[CLIENT_COMMANDS.CREATE_COLLECTION]: ({ message }) => this.collectionHandler.handleCreateCollection(message),

			[CLIENT_COMMANDS.CREATE_FOLDER]: ({ message }) => this.collectionHandler.handleCreateFolder(message),

			[CLIENT_COMMANDS.UPDATE_FOLDER]: ({ message }) => this.collectionHandler.handleUpdateFolder(message),

			[CLIENT_COMMANDS.DELETE_FOLDER]: ({ message }) => this.collectionHandler.handleDeleteFolder(message),

			[CLIENT_COMMANDS.SAVE_REQUEST]: ({ message }) => this.collectionHandler.handleSaveRequest(message),

			[CLIENT_COMMANDS.CLEAR_HISTORY]: () => this.historyHandler.handleClearHistory(),

			[CLIENT_COMMANDS.DELETE_HISTORY_ITEM]: ({ message }) => this.historyHandler.handleDeleteHistoryItem(message),
		};
	}

	// ---------- ROUTER ----------
	async route(message: MessageEnvelope, target: WebviewPanel | WebviewView): Promise<void> {
		const handlers = message.source === 'webview' ? this.webviewHandlers : this.webviewViewHandlers;

		const handler = handlers[message.command];
		if (!handler) {
			//TODO: Use BroadcastrHub to support multiple panels
			throw new Error(`Command ${message.command} is not allowed from ${message.source}`);
		}

		await handler({ message, target });
	}
}
