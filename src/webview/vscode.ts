/**
 * A typed wrapper around the `acquireVsCodeApi` function.
 *
 * This provides a singleton instance of the VS Code API that can be
 * imported into any component in the webview.
 */

interface VsCodeApi {
	postMessage(message: { command: string; [key: string]: any }): void;
}

declare const acquireVsCodeApi: () => VsCodeApi;

export const vscode = acquireVsCodeApi();
