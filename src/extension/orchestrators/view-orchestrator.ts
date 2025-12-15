import { window, ExtensionContext } from 'vscode';
import { SidebarProvider } from '@/extension/providers/sidebar-provider';
import { MessageRouter } from './message-router';

interface ViewOrchestratorDependencies {
	context: ExtensionContext;
	messageRouter: MessageRouter;
}

export class ViewOrchestrator {
	public readonly sidebarProvider: SidebarProvider;
	constructor(private dependencies: ViewOrchestratorDependencies) {
		this.sidebarProvider = new SidebarProvider(this.dependencies.context.extensionUri, this.dependencies.messageRouter);
		this.registerTreeViews();
	}

	/**
	 * Register all tree views with VSCode
	 */
	private registerTreeViews(): void {
		this.dependencies.context.subscriptions.push(window.registerWebviewViewProvider('apiClient.sidebar', this.sidebarProvider));
	}
}
