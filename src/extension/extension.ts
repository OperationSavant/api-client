import type { ExtensionContext} from 'vscode';
import { WebviewPanel } from 'vscode';
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
	const _ = new ViewOrchestrator({ context, messageRouter });
	await StateManager.initialize(appService);

	const commandRegistry = new CommandRegistry({
		context,
		createWebview: (name: string, kind: string) => {
			const scriptName = kind === 'main' ? 'main.js' : 'secondary.js';
			const rootId = kind === 'main' ? 'main-root' : 'secondary-root';
			const panel = webviewOrchestrator.createPanel(name, scriptName, rootId);
			return panel;
		},
	});
	commandRegistry.registerAll();
}

export function deactivate() {
	// Unit of Work handles persistence, just close DB connection
	closeDatabase();
}

