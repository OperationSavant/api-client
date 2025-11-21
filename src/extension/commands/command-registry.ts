import { commands, ExtensionContext, WebviewPanel } from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { SidebarProvider } from '../providers/sidebar-provider';

interface CommandRegistryDependencies {
	context: ExtensionContext;
	createWebview: (tabId: string, name?: string, args?: any[]) => WebviewPanel;
	panels: Map<string, WebviewPanel>;
	sidebarProvider?: SidebarProvider;
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
				const request = args?.[0];
				const panelName = request?.name || 'API Client';
				const panel = this.deps.createWebview(tabId, panelName, args);
				this.deps.panels.set(tabId, panel);
			})
		);
	}

	private registerSidebarCommand(): void {
		this.deps.context.subscriptions.push(
			commands.registerCommand('apiClient.openFromSidebar', (...args) => {
				const tabId = uuidv4();
				const request = args?.[0];
				const panelName = request?.name || 'API Client';
				const panel = this.deps.createWebview(tabId, panelName, args);
				this.deps.panels.set(tabId, panel);
			})
		);
	}
}
