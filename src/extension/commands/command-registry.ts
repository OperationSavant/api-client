import { commands, ExtensionContext, WebviewPanel } from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';

type PanelKind = 'main' | 'secondary';

interface OpenPanelOptions {
	kind: PanelKind;
	title: string;
	command?: string;
	payload?: any;
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
			commands.registerCommand('openRequest', (...args) => {
				const request = args?.[0]?.request;
				this.openPanel({
					kind: 'main',
					title: request?.name ?? 'API Client',
					payload: args?.[0],
				});
			}),
			commands.registerCommand('openCollectionView', collection => {
				this.openPanel({
					kind: 'secondary',
					title: collection?.name,
					payload: collection,
				});
			})
		);
	}
}
