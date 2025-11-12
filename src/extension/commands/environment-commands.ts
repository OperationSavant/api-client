import { window } from 'vscode';
import { environmentService } from '@/domain/services/environment-service';

interface EnvironmentCommandDependencies {
	saveState: () => void;
	// refreshProvider: () => void;
}

export class EnvironmentCommands {
	constructor(private deps: EnvironmentCommandDependencies) {}

	/**
	 * Command: apiClient.createEnvironment
	 * Shows input dialogs → creates environment scope → refreshes UI
	 */
	async createEnvironment(): Promise<void> {
		const name = await window.showInputBox({
			prompt: 'Enter environment name',
			placeHolder: 'Development',
		});

		if (!name) return;

		const scopeType = await window.showQuickPick(['global', 'collection', 'request'], { placeHolder: 'Select scope type' });

		if (!scopeType) return;

		environmentService.createScope(name, scopeType as any);

		this.deps.saveState();

		// this.deps.refreshProvider();
	}

	/**
	 * Command: apiClient.deleteEnvironment
	 * Shows confirmation → deletes environment → refreshes UI
	 */
	async deleteEnvironment(item: any): Promise<void> {
		if (!item || !item.scope) return;

		const confirmation = await window.showWarningMessage(`Delete environment "${item.scope.name}"?`, { modal: true }, 'Delete');

		if (confirmation !== 'Delete') return;

		environmentService.deleteScope(item.scope.id);

		this.deps.saveState();

		// this.deps.refreshProvider();
	}

	/**
	 * Command: apiClient.setActiveEnvironment
	 * Sets active environment scope → refreshes UI
	 */
	setActiveEnvironment(scopeId: string): void {
		environmentService.setActiveScope(scopeId);

		this.deps.saveState();

		// this.deps.refreshProvider();
	}

	/**
	 * Command: apiClient.refreshEnvironment
	 * Manually refresh environment tree view
	 */
	refresh(): void {
		// this.deps.refreshProvider();
	}
}
