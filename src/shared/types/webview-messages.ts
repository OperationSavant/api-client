import type { CLIENT_COMMANDS } from '../constants/commands';

export type ClientCommand = (typeof CLIENT_COMMANDS)[keyof typeof CLIENT_COMMANDS];

export type ClientSource = 'webview' | 'webviewView';

export type MessageEnvelope = {
	source: ClientSource;
	command: ClientCommand;
	payload?: unknown;
};
