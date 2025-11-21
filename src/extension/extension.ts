import { ExtensionContext, WebviewPanel } from 'vscode';
import { MessageRouter } from '@/extension/orchestrators/message-router';
import { WebviewOrchestrator } from '@/extension/orchestrators/webview-orchestrator';
import { ViewOrchestrator } from '@/extension/orchestrators/view-orchestrator';
import { ApplicationServices } from '@/extension/services/application-services';
import { CommandRegistry } from '@/extension/commands/command-registry';
import { StateManager } from './services/state-manager';
import { closeDatabase } from './services/db-service';

export async function activate(context: ExtensionContext) {
	const appService = await ApplicationServices.create(context);
	const messageRouter = new MessageRouter(appService);
	const webviewOrchestrator = new WebviewOrchestrator({ context, messageRouter });
	const viewOrchestrator = new ViewOrchestrator({
		context,
		messageRouter,
		collectionPersistence: appService.collectionPersistence, // ✅ Wire persistence
	});
	const panels = new Map<string, WebviewPanel>();
	StateManager.initialize();

	const commandRegistry = new CommandRegistry({
		context,
		createWebview: (tabId, name, args) => {
			const panel = webviewOrchestrator.createPanel(tabId, name, args);
			panel.onDidDispose(() => {
				panels.delete(tabId);
			});
			return panel;
		},
		panels,
		sidebarProvider: viewOrchestrator.sidebarProvider,
	});
	commandRegistry.registerAll();
}

export function deactivate() {
	StateManager.flush();
	closeDatabase();
}

