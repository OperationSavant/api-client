import { AuthConfig } from './auth';

export type WebviewMessage =
	| { command: 'webviewReady' }
	| { command: 'sendRequest'; url: string; method: string; headers: Record<string, string>; params: Record<string, string>; bodyConfig: any; auth: AuthConfig }
	| { command: 'createCollection'; name: string }
	| { command: 'saveRequest'; payload: { collectionId: string; requestId?: string; request: any } }
	| { command: 'updateCollection'; collectionId: string; name: string; description?: string }
	| { command: 'deleteCollection'; collectionId: string }
	| { command: 'deleteRequest'; collectionId: string; requestId: string }
	| { command: 'updateRequest'; collectionId: string; requestId: string; request: any }
	| { command: 'reorderRequests'; collectionId: string; requestIds: string[] }
	| { command: 'createEnvironment'; name: string; scopeType: string }
	| { command: 'deleteEnvironment'; scopeId: string; scopeName: string }
	| { command: 'setActiveEnvironment'; scopeId: string }
	| { command: 'clearHistory' }
	| { command: 'deleteHistoryItem'; historyId: string }
	| { command: 'formDataFileRequest'; index: number }
	| { command: 'binaryFileRequest' }
	| { command: 'openFileInEditor'; filePath: string }
	| { command: 'startOAuth2Authorization'; oauth2Config: any }
	| { command: 'exchangeOAuth2Code'; oauth2Config: any }
	| { command: 'generateOAuth2Token'; oauth2Config: any }
	| { command: 'requestDeviceCode'; oauth2Config: any };
