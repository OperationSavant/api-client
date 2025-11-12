import { window, ExtensionContext } from 'vscode';
// import { CollectionsTreeProvider } from '@/extension/providers/collections-tree-provider';
// import { HistoryTreeProvider } from '@/extension/providers/history-tree-provider';
// import { EnvironmentTreeProvider } from '@/extension/providers/environment-tree-provider';
import { SidebarProvider } from '@/extension/providers/sidebar-provider';

export interface SidebarProviders {
	// collections: CollectionsTreeProvider;
	// history: HistoryTreeProvider;
	// environment: EnvironmentTreeProvider;
	sidebar: SidebarProvider;
}

export class ViewOrchestrator {
	private providers: SidebarProviders;

	constructor(private context: ExtensionContext) {
		this.providers = {
			sidebar: new SidebarProvider(this.context.extensionUri),
		};

		this.registerTreeViews();

		this.refreshAll();
	}

	/**
	 * Register all tree views with VSCode
	 */
	private registerTreeViews(): void {
		// this.context.subscriptions.push(
		// 	window.createTreeView('apiClient.collections', {
		// 		treeDataProvider: this.providers.collections,
		// 		showCollapseAll: true,
		// 	})
		// );

		// this.context.subscriptions.push(
		// 	window.createTreeView('apiClient.history', {
		// 		treeDataProvider: this.providers.history,
		// 		showCollapseAll: true,
		// 	})
		// );

		// this.context.subscriptions.push(
		// 	window.createTreeView('apiClient.environment', {
		// 		treeDataProvider: this.providers.environment,
		// 		showCollapseAll: true,
		// 	})
		// );
		this.context.subscriptions.push(window.registerWebviewViewProvider('apiClient.sidebar', new SidebarProvider(this.context.extensionUri)));
	}

	/**
	 * Refresh all tree views
	 */
	refreshAll(): void {
		// this.providers.collections.refresh();
		// this.providers.history.refresh();
		// this.providers.environment.refresh();
	}

	/**
	 * Get providers for command registry
	 */
	getProviders(): SidebarProviders {
		return this.providers;
	}
}
