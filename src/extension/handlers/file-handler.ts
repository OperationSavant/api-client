import type { OpenDialogOptions } from 'vscode';
import { window, workspace, Uri, ViewColumn } from 'vscode';
import { contentType as mimeContentType } from 'mime-types';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';
import type { MessageEnvelope } from '@/shared/types/webview-messages';
import { SERVER_COMMANDS } from '@/shared/constants/commands';

export class FileHandler {
	constructor() {}

	/**
	 * Handle form-data file selection for specific field index
	 */
	async handleFormDataFileSelect(message: MessageEnvelope): Promise<void> {
		const index = message.payload as number;

		const options: OpenDialogOptions = {
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: true,
			openLabel: 'Select File',
		};

		const fileUris = await window.showOpenDialog(options);

		if (fileUris && fileUris.length > 0) {
			const paths = fileUris.map(uri => uri.fsPath);

			broadcasterHub.broadcast({ command: SERVER_COMMANDS.FORM_DATA_FILE_RESPONSE, data: { index, paths } });
		}
	}

	/**
	 * Handle binary body file selection
	 */
	async handleBinaryFileSelect(): Promise<void> {
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

			broadcasterHub.broadcast({ command: SERVER_COMMANDS.BINARY_FILE_RESPONSE, data: { path, size, contentType } });
		}
	}

	/**
	 * @deprecated Will be deleted in future versions
	 * @todo Remove in future versions and handle large files in different way
	 * Open large response file in editor
	 * @param message MessageEnvelope containing file path
	 */
	async handleOpenFileInEditor(message: MessageEnvelope): Promise<void> {
		if (!message.payload) {
			return;
		}

		const fileUri = Uri.parse(message.payload as string);

		const document = await workspace.openTextDocument(fileUri);

		await window.showTextDocument(document, {
			preview: false,
			viewColumn: ViewColumn.Beside,
		});
	}
}
