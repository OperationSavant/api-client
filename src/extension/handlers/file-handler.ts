import { WebviewPanel, window, workspace, OpenDialogOptions, Uri, ViewColumn } from 'vscode';
import * as path from 'path';
import { contentType as mimeContentType } from 'mime-types';

export class FileHandler {
	constructor() {}

	/**
	 * Handle form-data file selection for specific field index
	 */
	async handleFormDataFileSelect(message: any, panel: WebviewPanel): Promise<void> {
		const index = message.index;

		const options: OpenDialogOptions = {
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: true,
			openLabel: 'Select File',
		};

		const fileUris = await window.showOpenDialog(options);

		if (fileUris && fileUris.length > 0) {
			const paths = fileUris.map(uri => uri.fsPath);

			panel.webview.postMessage({
				command: 'formDataFileResponse',
				index,
				paths,
			});
		}
	}

	/**
	 * Handle binary body file selection
	 */
	async handleBinaryFileSelect(message: any, panel: WebviewPanel): Promise<void> {
		const options: OpenDialogOptions = {
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: false,
			openLabel: 'Select File',
		};

		const fileUris = await window.showOpenDialog(options);

		if (fileUris && fileUris.length > 0) {
			const path = fileUris[0].fsPath;
			const size = (await workspace.fs.stat(fileUris[0])).size;
			const contentType = mimeContentType(path) || 'application/octet-stream';

			panel.webview.postMessage({
				command: 'binaryFileResponse',
				path,
				size,
				contentType,
			});
		}
	}

	/**
	 * Open large response file in editor
	 */
	async handleOpenFileInEditor(message: any, panel: WebviewPanel): Promise<void> {
		if (!message.filePath) {
			return;
		}

		const fileUri = Uri.parse(message.filePath);

		const document = await workspace.openTextDocument(fileUri);

		await window.showTextDocument(document, {
			preview: false,
			viewColumn: ViewColumn.Beside,
		});
	}
}
