import * as vscode from 'vscode';
import { Collection, CollectionRequest } from '../types/collection';
import { collectionService } from '../services/collectionService';

export class CollectionsTreeProvider implements vscode.TreeDataProvider<CollectionTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<CollectionTreeItem | undefined | null | void> = new vscode.EventEmitter<CollectionTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<CollectionTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor() {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: CollectionTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: CollectionTreeItem): Thenable<CollectionTreeItem[]> {
		if (!element) {
			// Root level - return collections
			return Promise.resolve(this.getCollections());
		} else if (element.contextValue === 'collection') {
			// Collection level - return requests in collection
			return Promise.resolve(this.getRequestsInCollection(element.collection!));
		}
		return Promise.resolve([]);
	}

	private getCollections(): CollectionTreeItem[] {
		const collections = collectionService.getAllCollections();
		return collections.map(collection => new CollectionTreeItem(
			collection.name,
			vscode.TreeItemCollapsibleState.Collapsed,
			{
				contextValue: 'collection',
				collection: collection,
				iconPath: new vscode.ThemeIcon('folder'),
				tooltip: collection.description || collection.name
			}
		));
	}

	private getRequestsInCollection(collection: Collection): CollectionTreeItem[] {
		const requests = collection.requests || [];
		return requests.map(request => new CollectionTreeItem(
			`${request.method} ${request.name}`,
			vscode.TreeItemCollapsibleState.None,
			{
				contextValue: 'request',
				request: request,
				collection: collection,
				iconPath: new vscode.ThemeIcon('file'),
				tooltip: `${request.method} ${request.url}`,
				command: {
					command: 'apiClient.openRequest',
					title: 'Open Request',
					arguments: [request, collection]
				}
			}
		));
	}
}

export class CollectionTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly options: {
			contextValue?: string;
			collection?: Collection;
			request?: CollectionRequest;
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
	}

	collection?: Collection = this.options.collection;
	request?: CollectionRequest = this.options.request;
}
