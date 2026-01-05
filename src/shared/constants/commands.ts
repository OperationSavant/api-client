export const CLIENT_COMMANDS = {
	WEBVIEW_READY: 'wizard.apiClient.webviewReady',
	SEND_REQUEST: 'wizard.apiClient.sendRequest',

	CREATE_COLLECTION: 'wizard.apiClient.createCollection',
	UPDATE_COLLECTION: 'wizard.apiClient.updateCollection',
	DELETE_COLLECTION: 'wizard.apiClient.deleteCollection',

	CREATE_REQUEST: 'wizard.apiClient.createRequest',
	OPEN_REQUEST: 'wizard.apiClient.openRequest',
	SAVE_REQUEST: 'wizard.apiClient.saveRequest',
	UPDATE_REQUEST: 'wizard.apiClient.updateRequest',
	DELETE_REQUEST: 'wizard.apiClient.deleteRequest',
	REORDER_REQUESTS: 'wizard.apiClient.reorderRequests',

	CREATE_FOLDER: 'wizard.apiClient.createFolder',
	UPDATE_FOLDER: 'wizard.apiClient.updateFolder',
	DELETE_FOLDER: 'wizard.apiClient.deleteFolder',

	CREATE_ENVIRONMENT: 'wizard.apiClient.createEnvironment',
	DELETE_ENVIRONMENT: 'wizard.apiClient.deleteEnvironment',
	SET_ACTIVE_ENVIRONMENT: 'wizard.apiClient.setActiveEnvironment',

	CLEAR_HISTORY: 'wizard.apiClient.clearHistory',
	DELETE_HISTORY_ITEM: 'wizard.apiClient.deleteHistoryItem',

	FORM_DATA_FILE_REQUEST: 'wizard.apiClient.formDataFileRequest',
	BINARY_FILE_REQUEST: 'wizard.apiClient.binaryFileRequest',

	OPEN_FILE_IN_EDITOR: 'wizard.apiClient.openFileInEditor',

	START_OAUTH2_AUTHORIZATION: 'wizard.apiClient.startOAuth2Authorization',
	EXCHANGE_OAUTH2_CODE: 'wizard.apiClient.exchangeOAuth2Code',
	GENERATE_OAUTH2_TOKEN: 'wizard.apiClient.generateOAuth2Token',
	REQUEST_DEVICE_CODE: 'wizard.apiClient.requestDeviceCode',

	OPEN_COLLECTION_VIEW: 'wizard.apiClient.openCollectionView',

	SIDEBAR_READY: 'wizard.apiClient.sidebarReady',
	REFRESH_SIDEBAR: 'wizard.apiClient.refreshSidebar',
} as const;

export const SERVER_COMMANDS = {
	SET_PANEL_TABID: 'wizard.apiClient.setPanelTabId',
	WEBVIEW_INITIALIZE: 'wizard.apiClient.initialize',
	SIDEBAR_INITIALIZE: 'wizard.apiClient.sidebarInitialize',
	API_RESPONSE: 'wizard.apiClient.apiResponse',
	ADD_COLLECTION: 'wizard.apiClient.addCollection',
	SET_COLLECTIONS: 'wizard.apiClient.setCollections',
	ADD_HISTORY: 'wizard.apiClient.historyAdded',
	SET_HISTORY: 'wizard.apiClient.setHistory',
	DELETE_HISTORY_ITEM: 'wizard.apiClient.historyItemDeleted',
	CLEAR_HISTORY: 'wizard.apiClient.historyClear',
	FORM_DATA_FILE_RESPONSE: 'wizard.apiClient.formDataFileResponse',
	BINARY_FILE_RESPONSE: 'wizard.apiClient.binaryFileResponse',
	THEME_DATA: 'wizard.apiClient.themeData',
	SERVER_ERROR: 'wizard.apiClient.serverError',
} as const;
