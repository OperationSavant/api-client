export const CLIENT_COMMANDS = {
	WEBVIEW_READY: 'wizard.apiClient.webviewReady',
	SEND_REQUEST: 'wizard.apiClient.sendRequest',

	CREATE_COLLECTION: 'wizard.apiClient.createCollection',
	SAVE_REQUEST: 'wizard.apiClient.saveRequest',
	UPDATE_COLLECTION: 'wizard.apiClient.updateCollection',
	DELETE_COLLECTION: 'wizard.apiClient.deleteCollection',

	DELETE_REQUEST: 'wizard.apiClient.deleteRequest',
	UPDATE_REQUEST: 'wizard.apiClient.updateRequest',
	REORDER_REQUESTS: 'wizard.apiClient.reorderRequests',

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

	CREATE_NEW_REQUEST: 'wizard.apiClient.createNewRequest',
	CREATE_FOLDER: 'wizard.apiClient.createFolder',

	OPEN_REQUEST: 'wizard.apiClient.openRequest',

	SIDEBAR_READY: 'wizard.apiClient.sidebarReady',
	REFRESH_SIDEBAR: 'wizard.apiClient.refreshSidebar',

	SEARCH_COLLECTIONS: 'wizard.apiClient.searchCollections',
	SEARCH_HISTORY: 'wizard.apiClient.searchHistory',
} as const;
