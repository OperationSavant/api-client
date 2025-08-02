import * as vscode from 'vscode';
import { EnvironmentVariable, EnvironmentScope } from '../types/environment';
import { environmentService } from '../services/environment-service';

export class EnvironmentTreeProvider implements vscode.TreeDataProvider<EnvironmentTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<EnvironmentTreeItem | undefined | null | void> = new vscode.EventEmitter<
		EnvironmentTreeItem | undefined | null | void
	>();
	readonly onDidChangeTreeData: vscode.Event<EnvironmentTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor() {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: EnvironmentTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: EnvironmentTreeItem): Thenable<EnvironmentTreeItem[]> {
		if (!element) {
			// Root level - return environment scopes
			return Promise.resolve(this.getEnvironmentScopes());
		} else if (element.contextValue === 'environment') {
			// Environment level - return variables in scope
			return Promise.resolve(this.getVariablesInScope(element.scope!));
		}
		return Promise.resolve([]);
	}

	private getEnvironmentScopes(): EnvironmentTreeItem[] {
		const scopes = environmentService.getScopes(); // Get all scopes
		const activeScope = environmentService.getActiveScope();

		return scopes.map((scope: EnvironmentScope) => {
			const isActive = scope.id === activeScope?.id;
			const label = isActive ? `${scope.name} (active)` : scope.name;

			return new EnvironmentTreeItem(label, vscode.TreeItemCollapsibleState.Collapsed, {
				contextValue: 'environment',
				scope: scope,
				iconPath: new vscode.ThemeIcon(isActive ? 'check' : 'circle-outline'),
				tooltip: `${scope.type} scope: ${scope.name}`,
				command: isActive
					? undefined
					: {
							command: 'apiClient.setActiveEnvironment',
							title: 'Set Active Environment',
							arguments: [scope.id],
					  },
			});
		});
	}

	private getVariablesInScope(scope: EnvironmentScope): EnvironmentTreeItem[] {
		return scope.variables.map(variable => {
			const valuePreview = variable.value.length > 30 ? `${variable.value.substring(0, 30)}...` : variable.value;
			const label = `${variable.key} = ${valuePreview}`;

			return new EnvironmentTreeItem(label, vscode.TreeItemCollapsibleState.None, {
				contextValue: 'variable',
				variable: variable,
				scope: scope,
				iconPath: new vscode.ThemeIcon(variable.type === 'secret' ? 'lock' : 'symbol-variable'),
				tooltip: `${variable.key}: ${variable.value}${variable.description ? '\n' + variable.description : ''}`,
			});
		});
	}
}

export class EnvironmentTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly options: {
			contextValue?: string;
			scope?: EnvironmentScope;
			variable?: EnvironmentVariable;
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

	scope?: EnvironmentScope = this.options.scope;
	variable?: EnvironmentVariable = this.options.variable;
}
