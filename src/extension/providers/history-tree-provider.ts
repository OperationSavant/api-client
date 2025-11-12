import * as vscode from 'vscode';
import { HistoryItem } from '../../shared/types/history';
import { historyService } from '../../domain/services/history-service';

export class HistoryTreeProvider implements vscode.TreeDataProvider<HistoryTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<HistoryTreeItem | undefined | null | void> = new vscode.EventEmitter<
		HistoryTreeItem | undefined | null | void
	>();
	readonly onDidChangeTreeData: vscode.Event<HistoryTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor() {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: HistoryTreeItem): Thenable<HistoryTreeItem[]> {
		if (!element) {
			// Root level - return history items
			return Promise.resolve(this.getHistoryItems());
		}
		return Promise.resolve([]);
	}

	private getHistoryItems(): HistoryTreeItem[] {
		const history = historyService.getHistory(); // Get all history items
		const recentHistory = history.slice(0, 50); // Limit to recent 50 items

		return recentHistory.map(item => {
			const date = new Date(item.timestamp).toLocaleString();
			const statusBadge = item.response?.status ? `[${item.response.status}]` : '';
			const label = `${item.request.method} ${item.request.url} ${statusBadge}`;

			return new HistoryTreeItem(label, vscode.TreeItemCollapsibleState.None, {
				contextValue: 'historyItem',
				historyItem: item,
				iconPath: this.getMethodIcon(item.request.method),
				tooltip: `${item.request.method} ${item.request.url}\n${date}`,
				command: {
					command: 'apiClient.openRequest',
					title: 'Open Request',
					arguments: [item],
				},
			});
		});
	}

	private getMethodIcon(method: string): vscode.ThemeIcon {
		const iconMap: { [key: string]: string } = {
			GET: 'arrow-down',
			POST: 'add',
			PUT: 'edit',
			DELETE: 'trash',
			PATCH: 'diff',
			HEAD: 'eye',
			OPTIONS: 'settings',
		};
		return new vscode.ThemeIcon(iconMap[method] || 'file');
	}
}

export class HistoryTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly options: {
			contextValue?: string;
			historyItem?: HistoryItem;
			iconPath?: vscode.ThemeIcon;
			tooltip?: string;
			command?: vscode.Command;
		}
	) {
		super(label, collapsibleState);
		this.contextValue = options.contextValue;
		this.iconPath = options.iconPath;
		this.tooltip = options.tooltip;
		this.command = options.command;
		this.historyItem = options.historyItem;
	}
	historyItem?: HistoryItem;
}
