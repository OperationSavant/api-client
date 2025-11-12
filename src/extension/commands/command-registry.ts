import { commands, ExtensionContext, WebviewPanel } from 'vscode';
import { CollectionsTreeProvider } from '@/extension/providers/collections-tree-provider';
import { HistoryTreeProvider } from '@/extension/providers/history-tree-provider';
import { EnvironmentTreeProvider } from '@/extension/providers/environment-tree-provider';
import { CollectionCommands } from './collection-commands';
import { HistoryCommands } from './history-commands';
import { EnvironmentCommands } from './environment-commands';
import { v4 as uuidv4 } from 'uuid';

interface CommandRegistryDependencies {
	context: ExtensionContext;
	// providers: {
	// 	collections: CollectionsTreeProvider;
	// 	history: HistoryTreeProvider;
	// 	environment: EnvironmentTreeProvider;
	// };
	saveState: () => void;
	createWebview: (tabId: string, name?: string, args?: any[]) => WebviewPanel;
	panels: Map<string, WebviewPanel>;
}

export class CommandRegistry {
	private collectionCommands: CollectionCommands;
	private historyCommands: HistoryCommands;
	private environmentCommands: EnvironmentCommands;

	constructor(private deps: CommandRegistryDependencies) {
		this.collectionCommands = new CollectionCommands({
			saveState: deps.saveState,
			// refreshProvider: () => deps.providers.collections.refresh(),
			createWebview: deps.createWebview,
			getAllPanels: () => deps.panels,
		});

		this.historyCommands = new HistoryCommands({
			saveState: deps.saveState,
			// refreshProvider: () => deps.providers.history.refresh(),
		});

		this.environmentCommands = new EnvironmentCommands({
			saveState: deps.saveState,
			// refreshProvider: () => deps.providers.environment.refresh(),
		});
	}

	/**
	 * Register all commands
	 * Called once during extension activation
	 */
	registerAll(): void {
		this.registerMainCommand();
		this.registerCollectionCommands();
		this.registerHistoryCommands();
		this.registerEnvironmentCommands();
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

	/**
	 * Register collection-related commands (5 commands)
	 */
	private registerCollectionCommands(): void {
		const { context } = this.deps;

		context.subscriptions.push(
			commands.registerCommand('apiClient.createCollection', () => this.collectionCommands.createCollection()),

			commands.registerCommand('apiClient.deleteCollection', item => this.collectionCommands.deleteCollection(item)),

			commands.registerCommand('apiClient.createRequest', item => this.collectionCommands.createRequest(item)),

			commands.registerCommand('apiClient.deleteRequest', item => this.collectionCommands.deleteRequest(item)),

			commands.registerCommand('apiClient.refreshCollections', () => this.collectionCommands.refresh())
		);
	}

	/**
	 * Register history-related commands (2 commands)
	 */
	private registerHistoryCommands(): void {
		const { context } = this.deps;

		context.subscriptions.push(
			commands.registerCommand('apiClient.clearHistory', () => this.historyCommands.clearHistory()),

			commands.registerCommand('apiClient.refreshHistory', () => this.historyCommands.refresh())
		);
	}

	/**
	 * Register environment-related commands (4 commands)
	 */
	private registerEnvironmentCommands(): void {
		const { context } = this.deps;

		context.subscriptions.push(
			commands.registerCommand('apiClient.createEnvironment', () => this.environmentCommands.createEnvironment()),

			commands.registerCommand('apiClient.deleteEnvironment', item => this.environmentCommands.deleteEnvironment(item)),

			commands.registerCommand('apiClient.setActiveEnvironment', (scopeId: string) => this.environmentCommands.setActiveEnvironment(scopeId)),

			commands.registerCommand('apiClient.refreshEnvironment', () => this.environmentCommands.refresh())
		);
	}
}
