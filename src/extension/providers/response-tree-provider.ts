import * as vscode from 'vscode';

export interface ResponseTreeItem {
	id: string;
	label: string;
	value: any;
	type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
	path: string[];
	hasChildren: boolean;
	parentId?: string;
}

export class ResponseTreeProvider implements vscode.TreeDataProvider<ResponseTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<ResponseTreeItem | undefined | null | void> = new vscode.EventEmitter<
		ResponseTreeItem | undefined | null | void
	>();
	readonly onDidChangeTreeData: vscode.Event<ResponseTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private data: any = null;
	private contentType: 'json' | 'xml' = 'json';
	private treeItems: Map<string, ResponseTreeItem> = new Map();
	private expandedItems: Set<string> = new Set();

	constructor() {
		// Initialize with empty state
	}

	/**
	 * Update the response data and refresh the tree
	 */
	public updateResponse(data: string, contentType: 'json' | 'xml'): void {
		try {
			this.contentType = contentType;

			if (contentType === 'json') {
				this.data = JSON.parse(data);
			} else if (contentType === 'xml') {
				this.data = this.parseXmlToTree(data);
			}

			this.buildTreeItems();
			this.refresh();
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to parse ${contentType.toUpperCase()}: ${error}`);
			this.data = null;
			this.treeItems.clear();
			this.refresh();
		}
	}

	/**
	 * Clear the tree data
	 */
	public clear(): void {
		this.data = null;
		this.treeItems.clear();
		this.expandedItems.clear();
		this.refresh();
	}

	/**
	 * Refresh the tree view
	 */
	public refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	/**
	 * Get tree item for VS Code tree view
	 */
	getTreeItem(element: ResponseTreeItem): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(
			element.label,
			element.hasChildren
				? this.expandedItems.has(element.id)
					? vscode.TreeItemCollapsibleState.Expanded
					: vscode.TreeItemCollapsibleState.Collapsed
				: vscode.TreeItemCollapsibleState.None
		);

		// Set description (value preview)
		treeItem.description = this.getValueDescription(element.value, element.type);

		// Set tooltip with full path and value
		treeItem.tooltip = this.createTooltip(element);

		// Set context value for commands
		treeItem.contextValue = this.getContextValue(element);

		// Set icon based on type
		treeItem.iconPath = this.getIcon(element.type);

		// Store element ID for reference
		treeItem.id = element.id;

		return treeItem;
	}

	/**
	 * Get children of a tree item
	 */
	async getChildren(element?: ResponseTreeItem): Promise<ResponseTreeItem[]> {
		if (!this.data) {
			return [];
		}

		if (!element) {
			// Return root items
			return this.getRootItems();
		}

		// Return children of the element
		return this.getChildItems(element);
	}

	/**
	 * Build tree items from parsed data
	 */
	private buildTreeItems(): void {
		this.treeItems.clear();

		if (!this.data) return;

		this.buildTreeItemsRecursive(this.data, [], 'root', undefined);
	}

	/**
	 * Recursively build tree items
	 */
	private buildTreeItemsRecursive(value: any, path: string[], key: string, parentId?: string): ResponseTreeItem {
		const id = parentId ? `${parentId}.${key}` : key;
		const type = this.getValueType(value);
		const hasChildren =
			(type === 'object' && value !== null && Object.keys(value).length > 0) || (type === 'array' && Array.isArray(value) && value.length > 0);

		const item: ResponseTreeItem = {
			id,
			label: key,
			value,
			type,
			path,
			hasChildren,
			parentId,
		};

		this.treeItems.set(id, item);

		// Build children
		if (hasChildren) {
			if (type === 'object' && value !== null) {
				Object.entries(value).forEach(([childKey, childValue]) => {
					this.buildTreeItemsRecursive(childValue, [...path, childKey], childKey, id);
				});
			} else if (type === 'array' && Array.isArray(value)) {
				value.forEach((childValue, index) => {
					this.buildTreeItemsRecursive(childValue, [...path, index.toString()], `[${index}]`, id);
				});
			}
		}

		return item;
	}

	/**
	 * Get root items for the tree
	 */
	private getRootItems(): ResponseTreeItem[] {
		if (this.data === null || this.data === undefined) {
			return [];
		}

		// If data is an object or array, return its direct children
		if (typeof this.data === 'object') {
			const rootItem = this.treeItems.get('root');
			if (rootItem) {
				return this.getChildItems(rootItem);
			}
		}

		// If data is a primitive, return it as a single item
		return [this.treeItems.get('root')].filter(Boolean) as ResponseTreeItem[];
	}

	/**
	 * Get child items for a tree item
	 */
	private getChildItems(element: ResponseTreeItem): ResponseTreeItem[] {
		const children: ResponseTreeItem[] = [];

		if (element.type === 'object' && element.value !== null) {
			Object.keys(element.value).forEach(key => {
				const childId = `${element.id}.${key}`;
				const child = this.treeItems.get(childId);
				if (child) children.push(child);
			});
		} else if (element.type === 'array' && Array.isArray(element.value)) {
			element.value.forEach((_, index) => {
				const childId = `${element.id}.[${index}]`;
				const child = this.treeItems.get(childId);
				if (child) children.push(child);
			});
		}

		return children;
	}

	/**
	 * Get value type
	 */
	private getValueType(value: any): ResponseTreeItem['type'] {
		if (value === null) return 'null';
		if (Array.isArray(value)) return 'array';
		if (typeof value === 'object') return 'object';
		return typeof value as ResponseTreeItem['type'];
	}

	/**
	 * Get value description for tree item
	 */
	private getValueDescription(value: any, type: ResponseTreeItem['type']): string {
		switch (type) {
			case 'string':
				return `"${value.length > 50 ? value.substring(0, 50) + '...' : value}"`;
			case 'number':
			case 'boolean':
				return String(value);
			case 'null':
				return 'null';
			case 'object':
				return value === null ? 'null' : `{ ${Object.keys(value).length} properties }`;
			case 'array':
				return `[ ${value.length} items ]`;
			default:
				return '';
		}
	}

	/**
	 * Create tooltip for tree item
	 */
	private createTooltip(element: ResponseTreeItem): vscode.MarkdownString {
		const tooltip = new vscode.MarkdownString();
		tooltip.isTrusted = true;

		tooltip.appendMarkdown(`**Path:** \`${element.path.join('.')}\`\n\n`);
		tooltip.appendMarkdown(`**Type:** \`${element.type}\`\n\n`);

		if (element.type !== 'object' && element.type !== 'array') {
			tooltip.appendMarkdown(`**Value:** \`${JSON.stringify(element.value)}\`\n\n`);
		}

		return tooltip;
	}

	/**
	 * Get context value for commands
	 */
	private getContextValue(element: ResponseTreeItem): string {
		const contexts = ['responseTreeItem'];

		if (element.type === 'string' || element.type === 'number') {
			contexts.push('copyable');
		}

		if (element.hasChildren) {
			contexts.push('expandable');
		}

		return contexts.join(',');
	}

	/**
	 * Get icon for tree item based on type
	 */
	private getIcon(type: ResponseTreeItem['type']): vscode.ThemeIcon {
		switch (type) {
			case 'object':
				return new vscode.ThemeIcon('symbol-object');
			case 'array':
				return new vscode.ThemeIcon('symbol-array');
			case 'string':
				return new vscode.ThemeIcon('symbol-string');
			case 'number':
				return new vscode.ThemeIcon('symbol-number');
			case 'boolean':
				return new vscode.ThemeIcon('symbol-boolean');
			case 'null':
				return new vscode.ThemeIcon('symbol-null');
			default:
				return new vscode.ThemeIcon('symbol-misc');
		}
	}

	/**
	 * Parse XML to tree structure (simplified)
	 */
	private parseXmlToTree(xmlString: string): any {
		// This is a basic implementation
		// In production, you'd use a proper XML parser
		try {
			// Remove comments and processing instructions
			const cleanXml = xmlString.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '');

			// Very basic XML to JSON conversion
			// This is simplified and should be replaced with a proper parser
			const result: any = {};

			// Extract root element
			const rootMatch = cleanXml.match(/<(\w+)[^>]*>/);
			if (rootMatch) {
				result[rootMatch[1]] = 'XML content (simplified parsing)';
			}

			return result;
		} catch (error) {
			throw new Error('Failed to parse XML');
		}
	}

	/**
	 * Copy value to clipboard
	 */
	public async copyValue(element: ResponseTreeItem): Promise<void> {
		const value = typeof element.value === 'string' ? element.value : JSON.stringify(element.value, null, 2);

		await vscode.env.clipboard.writeText(value);
		vscode.window.showInformationMessage(`Copied value to clipboard`);
	}

	/**
	 * Copy path to clipboard
	 */
	public async copyPath(element: ResponseTreeItem): Promise<void> {
		const path = element.path.join('.');
		await vscode.env.clipboard.writeText(path);
		vscode.window.showInformationMessage(`Copied path to clipboard: ${path}`);
	}

	/**
	 * Toggle expansion state
	 */
	public toggleExpansion(element: ResponseTreeItem): void {
		if (element.hasChildren) {
			if (this.expandedItems.has(element.id)) {
				this.expandedItems.delete(element.id);
			} else {
				this.expandedItems.add(element.id);
			}
			this.refresh();
		}
	}

	/**
	 * Expand all items
	 */
	public expandAll(): void {
		this.treeItems.forEach((item, id) => {
			if (item.hasChildren) {
				this.expandedItems.add(id);
			}
		});
		this.refresh();
	}

	/**
	 * Collapse all items
	 */
	public collapseAll(): void {
		this.expandedItems.clear();
		this.refresh();
	}

	/**
	 * Search in tree
	 */
	public search(searchTerm: string): ResponseTreeItem[] {
		const results: ResponseTreeItem[] = [];

		this.treeItems.forEach(item => {
			const searchLower = searchTerm.toLowerCase();
			const keyMatch = item.label.toLowerCase().includes(searchLower);
			const valueMatch = typeof item.value === 'string' && item.value.toLowerCase().includes(searchLower);

			if (keyMatch || valueMatch) {
				results.push(item);
			}
		});

		return results;
	}
}
