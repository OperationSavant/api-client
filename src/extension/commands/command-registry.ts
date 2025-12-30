import type { ExtensionContext, WebviewPanel } from 'vscode';
import { commands } from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';
import { CLIENT_COMMANDS } from '@/shared/constants/commands';

type PanelKind = 'main' | 'secondary';

interface OpenPanelOptions {
	kind: PanelKind;
	title: string;
	command?: string;
	payload?: unknown;
}

interface CommandRegistryDependencies {
	context: ExtensionContext;
	createWebview: (name: string, kind: PanelKind) => WebviewPanel;
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

	private openPanel(options: OpenPanelOptions) {
		const tabId = uuidv4();
		const panel = this.deps.createWebview(options.title, options.kind);

		broadcasterHub.registerPanel(tabId, panel, options.payload ? options.payload : undefined);

		return panel;
	}

	/**
	 * Register main API Client command
	 */
	private registerMainCommand(): void {
		this.deps.context.subscriptions.push(
			commands.registerCommand(CLIENT_COMMANDS.CREATE_REQUEST, _ => {
				this.openPanel({
					kind: 'main',
					title: 'API Client',
				});
			}),
			commands.registerCommand(CLIENT_COMMANDS.OPEN_REQUEST, (...args) => {
				const request = args[0].request;
				this.openPanel({
					kind: 'main',
					title: request.name,
					payload: args[0],
				});
			}),
			commands.registerCommand(CLIENT_COMMANDS.OPEN_COLLECTION_VIEW, collection => {
				this.openPanel({
					kind: 'secondary',
					title: collection?.name,
					payload: collection,
				});
			})
		);
	}
}
