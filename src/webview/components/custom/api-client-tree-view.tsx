import React, { useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import {
	ChevronRight,
	ChevronDown,
	Folder,
	File,
	MoreHorizontal,
	Copy,
	MoveRight,
	Files,
	FilePlus,
	FolderPlus,
	Pencil,
	Trash2,
	FolderOpen,
	Search,
	X,
	UserRoundPlus,
} from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuGroup,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '../ui/input';
import { FolderNode, TreeNode } from '@/shared/types/tree-node';
import ApiClientButton from './api-client-button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

/* ------------------------------------------------------
   TYPES
------------------------------------------------------- */

export interface TreeViewProps {
	data: TreeNode[];
	className?: string;
	onSelect?: (node: TreeNode) => void;
	onChange?: (data: TreeNode[]) => void;
	expandOnRowClick?: boolean;
	onRename?: (node: TreeNode, newLabel: string) => void;
	onDelete?: (node: TreeNode) => void;
	onNewFile?: (parentNode: TreeNode) => void;
	onNewFolder?: (parentNode: TreeNode) => void;
	searchable?: boolean;
}

/* ------------------------------------------------------
   HELPERS
------------------------------------------------------- */

type FlatNode = { node: TreeNode; level: number };

function flattenTree(nodes: TreeNode[], expanded: Record<string, boolean>): FlatNode[] {
	const result: FlatNode[] = [];
	const walk = (list: TreeNode[], level: number) => {
		for (const n of list) {
			result.push({ node: n, level });
			if (n.type === 'folder' && n.children && expanded[n.id]) {
				walk(n.children, level + 1);
			}
		}
	};
	walk(nodes, 0);
	return result;
}

function findParentInFlat(flat: FlatNode[], id: string): FlatNode | null {
	const index = flat.findIndex(x => x.node.id === id);
	if (index <= 0) return null;
	const level = flat[index].level;
	for (let i = index - 1; i >= 0; i--) {
		if (flat[i].level < level) return flat[i];
	}
	return null;
}

function canFocus(el: HTMLElement | null): boolean {
	if (!el || !el.isConnected) return false;
	return el.offsetParent !== null;
}

/**
 * Find all nodes matching search query
 */
function findMatchingNodes(nodes: TreeNode[], query: string): Set<string> {
	const matches = new Set<string>();
	if (!query) return matches;

	const lowerQuery = query.toLowerCase();

	const search = (nodeList: TreeNode[]) => {
		nodeList.forEach(node => {
			if (node.label.toLowerCase().includes(lowerQuery)) {
				matches.add(node.id);
			}
			if (node.type === 'folder' && node.children) {
				search(node.children);
			}
		});
	};

	search(nodes);
	return matches;
}

/**
 * Auto-expand all parent folders of matched nodes
 */
function getParentIdsToExpand(nodes: TreeNode[], matchedIds: Set<string>): Set<string> {
	const parentsToExpand = new Set<string>();

	const findParents = (nodeList: TreeNode[], ancestors: string[]): void => {
		nodeList.forEach(node => {
			if (matchedIds.has(node.id)) {
				// Add all ancestors to expand
				ancestors.forEach(id => parentsToExpand.add(id));
			}
			if (node.type === 'folder' && node.children) {
				findParents(node.children, [...ancestors, node.id]);
			}
		});
	};

	findParents(nodes, []);
	return parentsToExpand;
}

/**
 * Highlight matching text in label
 */
function highlightText(text: string, query: string): React.ReactNode {
	if (!query) return text;

	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const index = lowerText.indexOf(lowerQuery);

	if (index === -1) return text;

	const before = text.slice(0, index);
	const match = text.slice(index, index + query.length);
	const after = text.slice(index + query.length);

	return (
		<>
			{before}
			<mark className='bg-warning/40 text-warning-foreground rounded px-0.5'>{match}</mark>
			{highlightText(after, query)}
		</>
	);
}

/* ------------------------------------------------------
   MAIN TREEVIEW
------------------------------------------------------- */

export const TreeView: React.FC<TreeViewProps> = ({
	data,
	className,
	onSelect,
	onChange,
	expandOnRowClick = true,
	onRename,
	onDelete,
	onNewFile,
	onNewFolder,
	searchable = false,
}) => {
	const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => initExpanded(data));
	const [activeId, setActiveId] = React.useState<string | null>(null);
	const [draggingId, setDraggingId] = React.useState<string | null>(null);
	const [dropIndicator, setDropIndicator] = React.useState<{ targetId: string; position: 'above' | 'inside' | 'below' } | null>(null);
	const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

	const [searchQuery, setSearchQuery] = React.useState('');
	const [debouncedQuery, setDebouncedQuery] = React.useState('');
	const [matchedNodeIds, setMatchedNodeIds] = React.useState<Set<string>>(new Set());

	const autoExpandTimeouts = React.useRef<Map<string, number>>(new Map());
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const nodeRefs = React.useRef<Map<string, HTMLElement>>(new Map());

	React.useEffect(() => {
		return () => {
			autoExpandTimeouts.current.forEach(id => clearTimeout(id));
			autoExpandTimeouts.current.clear();
		};
	}, []);

	// Debounce search query
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchQuery);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Find matches and auto-expand parents
	React.useEffect(() => {
		if (!debouncedQuery) {
			setMatchedNodeIds(new Set());
			return;
		}

		const matches = findMatchingNodes(data, debouncedQuery);
		setMatchedNodeIds(matches);

		// Auto-expand parent folders of matched nodes
		const parentsToExpand = getParentIdsToExpand(data, matches);
		setExpanded(prev => {
			const newExpanded = { ...prev };
			parentsToExpand.forEach(id => {
				newExpanded[id] = true;
			});
			return newExpanded;
		});
	}, [debouncedQuery, data]);

	const flat = React.useMemo(() => flattenTree(data, expanded), [data, expanded]);

	const handleMove = (sourceId: string, targetId: string, position: 'above' | 'inside' | 'below') => {
		if (!findNode(data, sourceId)) {
			console.warn('Invalid drag source:', sourceId);
			return;
		}

		const cloned = structuredClone(data) as TreeNode[];
		const source = removeNode(cloned, sourceId);
		if (!source) return;

		if (isDescendant(source, targetId)) return;

		if (position === 'inside') {
			const target = findNode(cloned, targetId);
			if (!target || target.type !== 'folder') return;
			target.children ??= [];
			target.children.push(source);
		} else if (position === 'above') {
			insertBefore(cloned, targetId, source);
		} else {
			insertAfter(cloned, targetId, source);
		}

		onChange?.(cloned);
	};

	const focusNode = (id: string | null) => {
		if (!id) return;
		const el = nodeRefs.current.get(id) as HTMLElement | null;
		if (canFocus(el)) {
			el?.focus({ preventScroll: true });
			setActiveId(id);
		}
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (!flat.length) return;

		if (!activeId) {
			focusNode(flat[0].node.id);
			e.preventDefault();
			return;
		}

		const index = flat.findIndex(f => f.node.id === activeId);
		if (index === -1) return;

		const current = flat[index].node;

		switch (e.key) {
			case 'ArrowDown': {
				const next = flat[index + 1];
				if (next) focusNode(next.node.id);
				e.preventDefault();
				break;
			}
			case 'ArrowUp': {
				const prev = flat[index - 1];
				if (prev) focusNode(prev.node.id);
				e.preventDefault();
				break;
			}
			case 'Home': {
				focusNode(flat[0].node.id);
				e.preventDefault();
				break;
			}
			case 'End': {
				focusNode(flat[flat.length - 1].node.id);
				e.preventDefault();
				break;
			}
			case 'ArrowRight': {
				if (current.type === 'folder' && current.children.length) {
					if (!expanded[current.id]) {
						setExpanded(p => ({ ...p, [current.id]: true }));
					} else {
						const next = flat[index + 1];
						if (next && next.level === flat[index].level + 1) focusNode(next.node.id);
					}
				}
				e.preventDefault();
				break;
			}
			case 'ArrowLeft': {
				if (expanded[current.id]) {
					setExpanded(p => ({ ...p, [current.id]: false }));
				} else {
					const parent = findParentInFlat(flat, current.id);
					if (parent) focusNode(parent.node.id);
				}
				e.preventDefault();
				break;
			}
			case 'Enter':
			case ' ': {
				if (!current.disabled) {
					onSelect?.(current);
				}
				e.preventDefault();
				break;
			}
			case 'Delete': {
				if (!current.disabled && onDelete) {
					onDelete(current);
				}
				e.preventDefault();
				break;
			}
			default:
				break;
		}
	};

	useEffect(() => {
		if (!searchable) {
			setSearchQuery('');
			setDebouncedQuery('');
			setMatchedNodeIds(new Set());
		}
	}, [searchable]);

	const handleClearSearch = () => {
		setSearchQuery('');
		setDebouncedQuery('');
		setMatchedNodeIds(new Set());
	};

	const handleExpandAll = () => {
		const allFolderIds: Record<string, boolean> = {};
		const collectFolderIds = (nodes: TreeNode[]) => {
			nodes.forEach(node => {
				if (node.type === 'folder') {
					allFolderIds[node.id] = true;
					if (node.children) {
						collectFolderIds(node.children);
					}
				}
			});
		};
		collectFolderIds(data);
		setExpanded(allFolderIds);
	};

	const handleCollapseAll = () => {
		setExpanded({});
	};

	return (
		<div className={cn('flex flex-col h-full', className)}>
			{/* Search Input */}
			{searchable && (
				<div className='px-2 py-2'>
					<div className='flex justify-between items-center mb-2'>
						<Tooltip>
							<TooltipTrigger>
								<ApiClientButton variant='ghost' size='icon' className='mr-2 p-0 border'>
									<UserRoundPlus className='h-4 w-4' />
								</ApiClientButton>
								<TooltipContent>Add New Collection</TooltipContent>
							</TooltipTrigger>
						</Tooltip>
						<div className='relative w-full'>
							<Search className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
							<Input
								type='text'
								placeholder='Search...'
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className='pl-8 pr-8 text-sm border'
							/>
							{searchQuery && (
								<Button variant='ghost' size='icon' className='absolute right-0 top-1/2 -translate-y-1/2' onClick={handleClearSearch}>
									<X className='h-3 w-3' />
								</Button>
							)}
						</div>
					</div>
					{/* Expand/Collapse All Buttons */}
					<div className='flex gap-2'>
						<Button variant='outline' size='sm' className='flex-1 h-7 text-xs' onClick={handleExpandAll}>
							<ChevronDown className='h-3 w-3 mr-1' />
							Expand All
						</Button>
						<Button variant='outline' size='sm' className='flex-1 h-7 text-xs' onClick={handleCollapseAll}>
							<ChevronRight className='h-3 w-3 mr-1' />
							Collapse All
						</Button>
					</div>

					{/* Match Count */}
					{matchedNodeIds.size > 0 && (
						<p className='text-xs text-muted-foreground italic mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200'>
							{matchedNodeIds.size} {matchedNodeIds.size === 1 ? 'match' : 'matches'} found
						</p>
					)}
				</div>
			)}

			{/* Tree */}
			<ScrollArea className='flex-1 overflow-auto'>
				<div ref={containerRef} role='tree' className='py-1 text-sm' onKeyDown={onKeyDown} tabIndex={0}>
					{data.map(node => (
						<TreeNodeItem
							key={node.id}
							node={node}
							level={0}
							expanded={expanded}
							setExpanded={setExpanded}
							onSelect={onSelect}
							activeId={activeId}
							setActiveId={id => {
								setActiveId(id);
								focusNode(id);
							}}
							draggingId={draggingId}
							setDraggingId={setDraggingId}
							dropIndicator={dropIndicator}
							setDropIndicator={setDropIndicator}
							onMove={handleMove}
							autoExpandTimeouts={autoExpandTimeouts}
							nodeRefs={nodeRefs}
							expandOnRowClick={expandOnRowClick}
							openMenuId={openMenuId}
							setOpenMenuId={setOpenMenuId}
							onRename={onRename}
							onDelete={onDelete}
							onNewFile={onNewFile}
							onNewFolder={onNewFolder}
							searchQuery={debouncedQuery}
							isMatched={matchedNodeIds.has(node.id)}
							matchedNodeIds={matchedNodeIds}
						/>
					))}
				</div>
			</ScrollArea>
		</div>
	);
};

/* ------------------------------------------------------
   SINGLE TREE NODE
------------------------------------------------------- */

interface TreeNodeItemProps {
	node: TreeNode;
	level: number;
	expanded: Record<string, boolean>;
	setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
	onSelect?: (node: TreeNode) => void;
	activeId: string | null;
	setActiveId: (id: string | null) => void;
	draggingId: string | null;
	setDraggingId: (id: string | null) => void;
	dropIndicator: { targetId: string; position: 'above' | 'inside' | 'below' } | null;
	setDropIndicator: (v: any) => void;
	onMove: (sourceId: string, targetId: string, position: 'above' | 'inside' | 'below') => void;
	autoExpandTimeouts: React.RefObject<Map<string, number>>;
	nodeRefs: React.RefObject<Map<string, HTMLElement>>;
	expandOnRowClick: boolean;
	openMenuId: string | null;
	setOpenMenuId: (id: string | null) => void;
	onRename?: (node: TreeNode, newLabel: string) => void;
	onDelete?: (node: TreeNode) => void;
	onNewFile?: (parentNode: TreeNode) => void;
	onNewFolder?: (parentNode: TreeNode) => void;
	searchQuery: string;
	isMatched: boolean;
	matchedNodeIds: Set<string>;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
	node,
	level,
	expanded,
	setExpanded,
	onSelect,
	activeId,
	setActiveId,
	draggingId,
	setDraggingId,
	dropIndicator,
	setDropIndicator,
	onMove,
	autoExpandTimeouts,
	nodeRefs,
	expandOnRowClick,
	openMenuId,
	setOpenMenuId,
	onRename,
	onDelete,
	onNewFile,
	onNewFolder,
	searchQuery,
	isMatched,
	matchedNodeIds,
}) => {
	const hasChildren = node.type === 'folder' && Boolean(node.children?.length);
	const isExpanded = Boolean(expanded[node.id]);
	const isActive = activeId === node.id;
	const isMenuOpen = openMenuId === node.id;

	const ref = React.useRef<HTMLDivElement | null>(null);

	React.useEffect(() => {
		if (ref.current) {
			nodeRefs.current?.set(node.id, ref.current);
		}
		return () => {
			nodeRefs.current?.delete(node.id);
		};
	}, [node.id, nodeRefs]);

	const handleRowClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		if (node.disabled) return;

		setActiveId(node.id);
		onSelect?.(node);

		if (expandOnRowClick && hasChildren) {
			setExpanded(prev => ({ ...prev, [node.id]: !prev[node.id] }));
		}

		if (ref.current && canFocus(ref.current)) {
			ref.current.focus({ preventScroll: true });
		}
	};

	const handleChevronClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setExpanded(prev => ({ ...prev, [node.id]: !prev[node.id] }));
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!node.disabled) {
			setActiveId(node.id);
			setOpenMenuId(node.id);
		}
	};

	const dragStart = (e: React.DragEvent) => {
		if (node.disabled) {
			e.preventDefault();
			return;
		}
		e.stopPropagation();
		setDraggingId(node.id);
		e.dataTransfer.setData('text/plain', node.id);
		e.dataTransfer.effectAllowed = 'move';
	};

	const dragEnd = () => {
		setDraggingId(null);
		setDropIndicator(null);
		autoExpandTimeouts.current?.forEach(id => clearTimeout(id));
		autoExpandTimeouts.current?.clear();
	};

	const getDropPosition = (e: React.DragEvent): 'above' | 'inside' | 'below' => {
		const el = ref.current!;
		const rect = el.getBoundingClientRect();
		const offset = e.clientY - rect.top;
		if (offset < rect.height * 0.25) return 'above';
		if (offset > rect.height * 0.75) return 'below';
		return 'inside';
	};

	const dragOver = (e: React.DragEvent) => {
		e.preventDefault();
		const pos = getDropPosition(e);

		if (node.type === 'file' && pos === 'inside') {
			const el = ref.current!;
			const rect = el.getBoundingClientRect();
			const offset = e.clientY - rect.top;
			const fallback = offset < rect.height / 2 ? 'above' : 'below';
			setDropIndicator({ targetId: node.id, position: fallback });
			return;
		}

		setDropIndicator({ targetId: node.id, position: pos });

		if (pos === 'inside' && hasChildren && !isExpanded) {
			const existingTimeout = autoExpandTimeouts.current?.get(node.id);
			if (existingTimeout) {
				clearTimeout(existingTimeout);
			}

			const timeoutId = window.setTimeout(() => {
				setExpanded(prev => ({ ...prev, [node.id]: true }));
				autoExpandTimeouts.current?.delete(node.id);
			}, 300);

			autoExpandTimeouts.current?.set(node.id, timeoutId);
		}
	};

	const dragLeave = () => {
		const existingTimeout = autoExpandTimeouts.current?.get(node.id);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
			autoExpandTimeouts.current?.delete(node.id);
		}
	};

	const drop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const sourceId = e.dataTransfer.getData('text/plain');
		const pos = dropIndicator?.position ?? 'inside';

		if (sourceId && sourceId !== node.id) {
			onMove(sourceId, node.id, pos);
		}

		setDraggingId(null);
		setDropIndicator(null);

		autoExpandTimeouts.current?.forEach(id => clearTimeout(id));
		autoExpandTimeouts.current?.clear();
	};

	const isDragging = draggingId === node.id;
	const isDropTarget = dropIndicator?.targetId === node.id;

	return (
		<>
			{/* Drop indicator above */}
			{isDropTarget && dropIndicator.position === 'above' && (
				<div className='relative h-0.5 w-full -mt-px bg-accent'>
					<div className='absolute left-0 -top-1 h-2 w-2 rounded-full bg-background border-2 border-accent' />
				</div>
			)}

			<DropdownMenu open={isMenuOpen} onOpenChange={open => setOpenMenuId(open ? node.id : null)}>
				<div
					ref={ref}
					role='treeitem'
					aria-expanded={hasChildren ? isExpanded : undefined}
					aria-selected={isActive ? 'true' : undefined}
					aria-disabled={node.disabled ? 'true' : undefined}
					tabIndex={isActive ? 0 : -1}
					data-tree-id={node.id}
					draggable={!node.disabled}
					onDragStart={dragStart}
					onDragEnd={dragEnd}
					onDragOver={dragOver}
					onDragLeave={dragLeave}
					onDrop={drop}
					onContextMenu={handleContextMenu}
					onClick={handleRowClick}
					className={cn(
						// Base styles
						'group/item flex items-center justify-between h-9 py-1.5 pr-2',
						'cursor-pointer rounded-sm select-none transition-colors',
						// Hover state
						'hover:bg-primary/20',
						// Active/selected state
						isActive && 'bg-(--list-active) text-(--list-active-foreground)',
						// Match highlight state
						isMatched && !isActive && 'bg-info/10',
						// Dragging state
						isDragging && 'opacity-40',
						// Drop target state
						isDropTarget && dropIndicator.position === 'inside' && 'bg-accent/10 outline outline-accent -outline-offset-1',
						// Disabled state
						node.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
						// Focus state
						'focus-visible:outline focus-visible:outline-ring focus-visible:-outline-offset-2'
					)}
					style={{
						paddingLeft: `calc(0.5rem + ${level} * 1rem)`,
					}}>
					{/* Content wrapper */}
					<div className='flex items-center gap-1 flex-1 min-w-0'>
						{/* Chevron */}
						{node.type === 'folder' ? (
							<Button
								variant='ghost'
								size='icon'
								className='h-5 w-5 p-0 hover:bg-transparent shrink-0'
								onClick={handleChevronClick}
								tabIndex={-1}
								aria-label={isExpanded ? 'Collapse' : 'Expand'}>
								{isExpanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
							</Button>
						) : (
							<span className='h-5 w-5 shrink-0' />
						)}

						{/* Icon */}
						<span className='h-5 w-5 flex items-center justify-center shrink-0'>
							{node.icon ??
								(node.type === 'folder' ? (
									isExpanded ? (
										<FolderOpen className='h-4 w-4 text-(--vscode-symbolIcon-folderForeground)' />
									) : (
										<Folder className='h-4 w-4 text-(--vscode-symbolIcon-folderForeground)' />
									)
								) : (
									<File className='h-4 w-4' />
								))}
						</span>

						{/* Label */}
						<span className='truncate'>{highlightText(node.label, searchQuery)}</span>
					</div>

					{/* More Options Menu */}
					<DropdownMenuTrigger asChild>
						<Button
							variant='ghost'
							size='icon'
							className='h-5 w-5 p-0 rounded-sm shrink-0 opacity-0 group-hover/item:opacity-100 hover:bg-muted transition-opacity'
							onClick={e => e.stopPropagation()}
							tabIndex={-1}
							aria-label='More options'>
							<MoreHorizontal className='h-4 w-4' />
						</Button>
					</DropdownMenuTrigger>
				</div>

				<TreeNodeMenu node={node} onRename={onRename} onDelete={onDelete} onNewFile={onNewFile} onNewFolder={onNewFolder} />
			</DropdownMenu>

			{/* Children */}
			{hasChildren && isExpanded && (
				<div role='group'>
					{node.children.map(child => (
						<TreeNodeItem
							key={child.id}
							node={child}
							level={level + 1}
							expanded={expanded}
							setExpanded={setExpanded}
							onSelect={onSelect}
							activeId={activeId}
							setActiveId={setActiveId}
							draggingId={draggingId}
							setDraggingId={setDraggingId}
							dropIndicator={dropIndicator}
							setDropIndicator={setDropIndicator}
							onMove={onMove}
							autoExpandTimeouts={autoExpandTimeouts}
							nodeRefs={nodeRefs}
							expandOnRowClick={expandOnRowClick}
							openMenuId={openMenuId}
							setOpenMenuId={setOpenMenuId}
							onRename={onRename}
							onDelete={onDelete}
							onNewFile={onNewFile}
							onNewFolder={onNewFolder}
							searchQuery={searchQuery}
							isMatched={matchedNodeIds.has(child.id)}
							matchedNodeIds={matchedNodeIds}
						/>
					))}
				</div>
			)}

			{/* Drop indicator below */}
			{isDropTarget && dropIndicator.position === 'below' && (
				<div className='relative h-0.5 w-full -mb-px bg-accent'>
					<div className='absolute left-0 -top-1 h-2 w-2 rounded-full bg-background border-2 border-accent' />
				</div>
			)}
		</>
	);
};

/* ------------------------------------------------------
   CONTEXT MENU
------------------------------------------------------- */

interface TreeNodeMenuProps {
	node: TreeNode;
	onRename?: (node: TreeNode, newLabel: string) => void;
	onDelete?: (node: TreeNode) => void;
	onNewFile?: (parentNode: TreeNode) => void;
	onNewFolder?: (parentNode: TreeNode) => void;
}

const TreeNodeMenu: React.FC<TreeNodeMenuProps> = ({ node, onRename, onDelete, onNewFile, onNewFolder }) => {
	return (
		<DropdownMenuContent align='end' onClick={e => e.stopPropagation()}>
			{node.type === 'folder' && (
				<>
					<DropdownMenuGroup>
						{onNewFile && (
							<DropdownMenuItem onClick={() => onNewFile(node)}>
								<FilePlus className='h-4 w-4 mr-2' />
								Add New Request
							</DropdownMenuItem>
						)}
						{onNewFolder && (
							<DropdownMenuItem onClick={() => onNewFolder(node)}>
								<FolderPlus className='h-4 w-4 mr-2' />
								Add New Folder
							</DropdownMenuItem>
						)}
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem>
							<Copy className='h-4 w-4 mr-2' />
							Copy To
						</DropdownMenuItem>
						<DropdownMenuItem>
							<MoveRight className='h-4 w-4 mr-2' />
							Move To
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
				</>
			)}
			<DropdownMenuGroup>
				{onRename && (
					<DropdownMenuItem onClick={() => onRename(node, node.label)}>
						<Pencil className='h-4 w-4 mr-2' />
						Rename
					</DropdownMenuItem>
				)}
				<DropdownMenuItem>
					<Files className='h-4 w-4 mr-2' />
					Duplicate
				</DropdownMenuItem>
				{onDelete && (
					<DropdownMenuItem onClick={() => onDelete(node)} variant='destructive'>
						<Trash2 className='h-4 w-4 mr-2' />
						Delete
					</DropdownMenuItem>
				)}
			</DropdownMenuGroup>
		</DropdownMenuContent>
	);
};

/* ------------------------------------------------------
   UTILITIES
------------------------------------------------------- */

function initExpanded(nodes: TreeNode[]): Record<string, boolean> {
	const out: Record<string, boolean> = {};
	const walk = (arr: TreeNode[]) => {
		arr.forEach(n => {
			if (n.type === 'folder') {
				if (n.defaultExpanded) out[n.id] = true;
				if (n.children) walk(n.children);
			}
		});
	};
	walk(nodes);
	return out;
}

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
	for (const n of nodes) {
		if (n.id === id) return n;
		if (n.type === 'folder' && n.children) {
			const f = findNode(n.children, id);
			if (f) return f;
		}
	}
	return null;
}

function removeNode(nodes: TreeNode[], id: string): TreeNode | null {
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].id === id) return nodes.splice(i, 1)[0];
		if (nodes[i].type === 'folder' && nodes[i].children) {
			const child = removeNode((nodes[i] as FolderNode).children, id);
			if (child) return child;
		}
	}
	return null;
}

function insertBefore(nodes: TreeNode[], targetId: string, item: TreeNode): boolean {
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].id === targetId) {
			nodes.splice(i, 0, item);
			return true;
		}
		if (nodes[i].type === 'folder' && nodes[i].children && insertBefore((nodes[i] as FolderNode).children, targetId, item)) return true;
	}
	return false;
}

function insertAfter(nodes: TreeNode[], targetId: string, item: TreeNode): boolean {
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].id === targetId) {
			nodes.splice(i + 1, 0, item);
			return true;
		}
		if (nodes[i].type === 'folder' && nodes[i].children && insertAfter((nodes[i] as FolderNode).children, targetId, item)) return true;
	}
	return false;
}

function isDescendant(possibleAncestor: TreeNode, descendantId: string): boolean {
	if (possibleAncestor.type !== 'folder' || !possibleAncestor.children) return false;
	for (const c of possibleAncestor.children) {
		if (c.id === descendantId) return true;
		if (isDescendant(c, descendantId)) return true;
	}
	return false;
}
