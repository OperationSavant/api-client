import { WebviewPanel, window } from 'vscode';
import { environmentService } from '@/domain/services/environment-service';
import { StateManager } from '../services/state-manager';

interface EnvironmentHandlerDependencies {
	environmentService: typeof environmentService;
}

export class EnvironmentHandler {
	constructor(private deps: EnvironmentHandlerDependencies) {}

	/**
	 * Create environment/scope
	 * ACTUAL CODE: extension.ts lines 169-182
	 */
	async handleCreateEnvironment(message: any, panel: WebviewPanel): Promise<void> {
		const { name, scopeType } = message;

		this.deps.environmentService.createScope(name, scopeType);

		StateManager.saveState();

		window.showInformationMessage(`Environment '${name}' created.`);
	}

	/**
	 * Delete environment/scope
	 * ACTUAL CODE: extension.ts lines 184-193
	 */
	async handleDeleteEnvironment(message: any, panel: WebviewPanel): Promise<void> {
		const { scopeId, scopeName } = message;

		const confirmation = await window.showWarningMessage(`Delete environment "${scopeName}"?`, { modal: true }, 'Delete');

		if (confirmation === 'Delete') {
			this.deps.environmentService.deleteScope(scopeId);

			StateManager.saveState();

			window.showInformationMessage(`Environment '${scopeName}' deleted.`);
		}
	}

	/**
	 * Set active environment
	 * ACTUAL CODE: extension.ts lines 195-199
	 */
	async handleSetActiveEnvironment(message: any, panel: WebviewPanel): Promise<void> {
		const { scopeId } = message;

		this.deps.environmentService.setActiveScope(scopeId);

		StateManager.saveState();

		window.showInformationMessage(`Active environment set.`);
	}
}
