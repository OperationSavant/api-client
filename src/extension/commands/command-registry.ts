import { commands, ExtensionContext, WebviewPanel } from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';

interface CommandRegistryDependencies {
	context: ExtensionContext;
	createWebview: (name?: string) => WebviewPanel;
}

export class CommandRegistry {
	constructor(private deps: CommandRegistryDependencies) {}

	/**
	 * Register all commands
	 * Called once during extension activation
	 */
	registerAll(): void {
		this.registerMainCommand();
	}

	/**
	 * Register main API Client command
	 */
	private registerMainCommand(): void {
		this.deps.context.subscriptions.push(
			commands.registerCommand('apiClient.openRequest', (...args) => {
				const tabId = uuidv4();
				let panelName = 'API Client';
				let panel = undefined;
				if (args && args.length > 0) {
					panelName = args?.[0]?.request?.name || 'API Client';
					panel = this.deps.createWebview(panelName);
					broadcasterHub.registerPanel(tabId, panel, [args[0]]);
				} else {
					panel = this.deps.createWebview(panelName);
					broadcasterHub.registerPanel(tabId, panel);
				}
			})
		);
	}
}
