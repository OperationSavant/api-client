import { window, ExtensionContext } from 'vscode';
import { SidebarProvider } from '@/extension/providers/sidebar-provider';
import { MessageRouter } from './message-router';
import { SidebarHandler } from '../handlers/sidebar-handler';
import { SQLiteCollectionPersistence } from '../services/collection-persistence';

interface ViewOrchestratorDependencies {
	context: ExtensionContext;
	messageRouter: MessageRouter;
	collectionPersistence: SQLiteCollectionPersistence;
}

export class ViewOrchestrator {
	public readonly sidebarProvider: SidebarProvider;
	constructor(private dependencies: ViewOrchestratorDependencies) {
		const sidebarHandler = new SidebarHandler({ collectionPersistence: this.dependencies.collectionPersistence });
		this.sidebarProvider = new SidebarProvider(this.dependencies.context.extensionUri, sidebarHandler);
		this.registerTreeViews();
	}

	/**
	 * Register all tree views with VSCode
	 */
	private registerTreeViews(): void {
		this.dependencies.context.subscriptions.push(window.registerWebviewViewProvider('apiClient.sidebar', this.sidebarProvider));
	}
}
