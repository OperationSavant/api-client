import { WebviewPanel, window, workspace, OpenDialogOptions, Uri, ViewColumn } from 'vscode';
import * as path from 'path';

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
			canSelectMany: false,
			openLabel: 'Select File',
		};

		const fileUris = await window.showOpenDialog(options);

		if (fileUris && fileUris.length > 0) {
			const filePath = fileUris[0].fsPath;
			const fileName = path.basename(filePath);

			panel.webview.postMessage({
				command: 'formDataFileSelected',
				index: index,
				filePath: filePath,
				fileName: fileName,
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
			const filePath = fileUris[0].fsPath;

			panel.webview.postMessage({
				command: 'binaryFileSelected',
				filePath: filePath,
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
