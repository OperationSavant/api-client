/**
 * A typed wrapper around the `acquireVsCodeApi` function.
 *
 * This provides a singleton instance of the VS Code API that can be
 * imported into any component in the webview.
 */

import type { MessageEnvelope } from '@/shared/types/webview-messages';

interface VsCodeApi {
	postMessage(message: MessageEnvelope): void;
}

declare const acquireVsCodeApi: () => VsCodeApi;

export const vscode = acquireVsCodeApi();
