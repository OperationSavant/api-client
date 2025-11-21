/* eslint-disable no-mixed-spaces-and-tabs */
import { AuthConfig } from './auth';
export type WebviewMessage =
	| { source: 'webview'; command: 'webviewReady' }
	| {
			source: 'webview';
			command: 'sendRequest';
			url: string;
			method: string;
			headers: Record<string, string>;
			params: Record<string, string>;
			bodyConfig: any;
			auth: AuthConfig;
	  }
	| { source: 'webview'; command: 'createCollection'; name: string }
	| { source: 'webview'; command: 'saveRequest'; payload: { collectionId: string; requestId?: string; request: any } }
	| { source: 'webview'; command: 'updateCollection'; collectionId: string; name: string; description?: string }
	| { source: 'webview'; command: 'deleteCollection'; collectionId: string }
	| { source: 'webview'; command: 'deleteRequest'; collectionId: string; requestId: string }
	| { source: 'webview'; command: 'updateRequest'; collectionId: string; requestId: string; request: any }
	| { source: 'webview'; command: 'reorderRequests'; collectionId: string; requestIds: string[] }
	| { source: 'webview'; command: 'createEnvironment'; name: string; scopeType: string }
	| { source: 'webview'; command: 'deleteEnvironment'; scopeId: string; scopeName: string }
	| { source: 'webview'; command: 'setActiveEnvironment'; scopeId: string }
	| { source: 'webview'; command: 'clearHistory' }
	| { source: 'webview'; command: 'deleteHistoryItem'; historyId: string }
	| { source: 'webview'; command: 'formDataFileRequest'; index: number }
	| { source: 'webview'; command: 'binaryFileRequest' }
	| { source: 'webview'; command: 'openFileInEditor'; filePath: string }
	| { source: 'webview'; command: 'startOAuth2Authorization'; oauth2Config: any }
	| { source: 'webview'; command: 'exchangeOAuth2Code'; oauth2Config: any }
	| { source: 'webview'; command: 'generateOAuth2Token'; oauth2Config: any }
	| { source: 'webview'; command: 'requestDeviceCode'; oauth2Config: any };

export type WebviewViewMessage =
	| { source: 'webviewView'; command: 'executeCommand'; commandId: string; args?: any[] }
	| { source: 'webviewView'; command: 'sidebarReady' }
	| { source: 'webviewView'; command: 'refreshSidebar' }
	| { source: 'webviewView'; command: 'searchCollections'; query: string }
	| { source: 'webviewView'; command: 'searchHistory'; query: string };
