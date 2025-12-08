type TreeNodeBase = {
	id: string;
	label: string;
	icon?: React.ReactNode;
	disabled?: boolean;
	metadata?: Record<string, unknown>;
};

export type FolderNode = TreeNodeBase & {
	type: 'folder';
	children: TreeNode[];
	defaultExpanded?: boolean;
};

export type FileNode = TreeNodeBase & {
	type: 'file';
	children?: never;
};

export type TreeNode = FolderNode | FileNode;
