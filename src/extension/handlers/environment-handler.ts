import type { WebviewPanel} from 'vscode';
import { window } from 'vscode';
import { environmentService } from '@/domain/services/environment-service';
import { unitOfWork } from '@/domain/services/unit-of-work';

export class EnvironmentHandler {
	constructor() {}

	/**
	 * Create environment/scope
	 * ACTUAL CODE: extension.ts lines 169-182
	 */
	async handleCreateEnvironment(message: any, panel: WebviewPanel): Promise<void> {
		const { name, scopeType } = message;

		try {
			environmentService.createScope(name, scopeType);
			await unitOfWork.commit();
			window.showInformationMessage(`Environment '${name}' created.`);
		} catch (error) {
			console.error('[EnvironmentHandler] Failed to create environment:', error);
			unitOfWork.rollback();
			window.showErrorMessage(`Failed to create environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
			throw error;
		}
	}

	/**
	 * Delete environment/scope
	 * ACTUAL CODE: extension.ts lines 184-193
	 */
	async handleDeleteEnvironment(message: any, panel: WebviewPanel): Promise<void> {
		const { scopeId, scopeName } = message;

		const confirmation = await window.showWarningMessage(`Delete environment "${scopeName}"?`, { modal: true }, 'Delete');

		if (confirmation === 'Delete') {
			try {
				environmentService.deleteScope(scopeId);
				await unitOfWork.commit();
				window.showInformationMessage(`Environment '${scopeName}' deleted.`);
			} catch (error) {
				console.error('[EnvironmentHandler] Failed to delete environment:', error);
				unitOfWork.rollback();
				window.showErrorMessage(`Failed to delete environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
				throw error;
			}
		}
	}

	/**
	 * Set active environment
	 * ACTUAL CODE: extension.ts lines 195-199
	 */
	async handleSetActiveEnvironment(message: any, panel: WebviewPanel): Promise<void> {
		const { scopeId } = message;

		try {
			environmentService.setActiveScope(scopeId);
			await unitOfWork.commit();
			window.showInformationMessage(`Active environment set.`);
		} catch (error) {
			console.error('[EnvironmentHandler] Failed to set active environment:', error);
			unitOfWork.rollback();
			window.showErrorMessage(`Failed to set active environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
			throw error;
		}
	}
}
