import React from 'react';
import { cn } from '@/shared/lib/utils';
import { ChevronRight, ChevronDown, Folder, File, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ------------------------------------------------------
   TYPES
------------------------------------------------------- */

export type TreeNode = {
	id: string;
	label: string;
	icon?: React.ReactNode;
	children?: TreeNode[];
	disabled?: boolean;
	defaultExpanded?: boolean;
};

/* ------------------------------------------------------
   MAIN TREEVIEW
------------------------------------------------------- */

export const TreeView: React.FC<{
	data: TreeNode[];
	className?: string;
	onSelect?: (node: TreeNode) => void;
	onChange?: (data: TreeNode[]) => void;
}> = ({ data: initial, className, onSelect, onChange }) => {
	const [data, setData] = React.useState<TreeNode[]>(structuredClone(initial));
	const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => initExpanded(initial));

	const [activeId, setActiveId] = React.useState<string | null>(null);
	const [draggingId, setDraggingId] = React.useState<string | null>(null);

	const [dropIndicator, setDropIndicator] = React.useState<{
		targetId: string;
		position: 'above' | 'inside' | 'below';
	} | null>(null);

	const autoExpandTimeoutRef = React.useRef<number | null>(null);

	const updateData = (newData: TreeNode[]) => {
		setData(newData);
		onChange?.(newData);
	};

	const handleMove = (sourceId: string, targetId: string, position: 'above' | 'inside' | 'below') => {
		const cloned = structuredClone(data);
		const source = removeNode(cloned, sourceId);
		if (!source) return;

		if (position === 'inside') {
			const target = findNode(cloned, targetId);
			if (!target) return;
			target.children ??= [];
			target.children.push(source);
		} else if (position === 'above') {
			insertBefore(cloned, targetId, source);
		} else {
			insertAfter(cloned, targetId, source);
		}

		updateData(cloned);
	};

	return (
		<ScrollArea className={cn('h-full w-full [&_.scroll-area-viewport]:overflow-visible', className)}>
			<div role='tree' className='py-1 text-sm'>
				{data.map(node => (
					<TreeNodeItem
						key={node.id}
						node={node}
						level={0}
						expanded={expanded}
						setExpanded={setExpanded}
						onSelect={onSelect}
						activeId={activeId}
						setActiveId={setActiveId}
						draggingId={draggingId}
						setDraggingId={setDraggingId}
						dropIndicator={dropIndicator}
						setDropIndicator={setDropIndicator}
						onMove={handleMove}
						autoExpandTimeoutRef={autoExpandTimeoutRef}
					/>
				))}
			</div>
		</ScrollArea>
	);
};

/* ------------------------------------------------------
   SINGLE TREE NODE
------------------------------------------------------- */

const TreeNodeItem: React.FC<{
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
	autoExpandTimeoutRef: React.RefObject<number | null>;
}> = ({
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
	autoExpandTimeoutRef,
}) => {
	const hasChildren = Boolean(node.children?.length);
	const isExpanded = Boolean(expanded[node.id]);
	const isActive = activeId === node.id;

	const [menuOpen, setMenuOpen] = React.useState(false);
	const ref = React.useRef<HTMLDivElement | null>(null);

	/* ---------------- CLICK BEHAVIOR (FIXED!) ---------------- */

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		// Single click: select
		setActiveId(node.id);
		onSelect?.(node);

		// Single click: expand/collapse (VS Code default)
		if (hasChildren) {
			setExpanded(prev => ({ ...prev, [node.id]: !prev[node.id] }));
		}

		const el = ref.current;
		if (el && !isElementHidden(el)) {
			try {
				el.focus({ preventScroll: true } as FocusOptions);
			} catch {
				el.focus();
			}
		}
	};

	const handleChevron = (e: React.MouseEvent) => {
		e.stopPropagation();
		setExpanded(prev => ({ ...prev, [node.id]: !prev[node.id] }));
	};

	/* ---------------- CONTEXT MENU ---------------- */

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setActiveId(node.id);
		setMenuOpen(true);
	};

	/* ---------------- DRAG & DROP ---------------- */

	const dragStart = (e: React.DragEvent) => {
		e.stopPropagation();
		setDraggingId(node.id);
		e.dataTransfer.setData('text/plain', node.id);
	};

	const dragEnd = () => {
		setDraggingId(null);
		setDropIndicator(null);
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

		if (!hasChildren && pos === 'inside') {
			// files can't accept "inside"
			const el = ref.current!;
			const rect = el.getBoundingClientRect();
			const offset = e.clientY - rect.top;
			const fallback = offset < rect.height / 2 ? 'above' : 'below';
			setDropIndicator({ targetId: node.id, position: fallback });
			return;
		}

		setDropIndicator({ targetId: node.id, position: pos });

		// auto expand on hover
		if (pos === 'inside' && hasChildren && !isExpanded) {
			if (!autoExpandTimeoutRef.current) {
				autoExpandTimeoutRef.current = window.setTimeout(() => {
					setExpanded(prev => ({ ...prev, [node.id]: true }));
					autoExpandTimeoutRef.current = null;
				}, 300);
			}
		}
	};

	const dragLeave = () => {
		if (autoExpandTimeoutRef.current) {
			clearTimeout(autoExpandTimeoutRef.current);
			autoExpandTimeoutRef.current = null;
		}
	};

	const drop = (e: React.DragEvent) => {
		e.preventDefault();
		const sourceId = e.dataTransfer.getData('text/plain');
		const pos = dropIndicator?.position ?? 'inside';

		if (sourceId !== node.id) {
			onMove(sourceId, node.id, pos);
		}

		setDraggingId(null);
		setDropIndicator(null);
	};

	/* ---------------- RENDER ---------------- */

	return (
		<>
			{dropIndicator?.targetId === node.id && dropIndicator.position === 'above' && <div className='h-0.5 bg-accent w-full -mt-px' />}

			<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
				<div
					ref={ref}
					role='treeitem'
					tabIndex={isActive ? 0 : -1}
					data-tree-id={node.id}
					draggable
					onDragStart={dragStart}
					onDragEnd={dragEnd}
					onDragOver={dragOver}
					onDragLeave={dragLeave}
					onDrop={drop}
					onContextMenu={handleContextMenu}
					onClick={handleClick}
					className={cn(
						'flex items-center justify-between pr-2 cursor-pointer rounded-sm select-none',
						'h-9 py-1.5',
						isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
						dropIndicator?.targetId === node.id && dropIndicator.position === 'inside' ? 'bg-accent/10' : ''
					)}
					style={{ paddingLeft: 8 + level * 16 }}>
					<div className='flex items-center gap-1 flex-1 min-w-0'>
						{/* Chevron */}
						{hasChildren ? (
							<Button variant='ghost' size='icon' className='h-5 w-5 p-0 hover:bg-transparent' onClick={handleChevron} tabIndex={-1}>
								{isExpanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
							</Button>
						) : (
							<span className='h-5 w-5' />
						)}

						{/* Icon */}
						<span className='h-5 w-5 flex items-center justify-center shrink-0'>
							{node.icon ?? (hasChildren ? <Folder className='h-4 w-4' /> : <File className='h-4 w-4' />)}
						</span>

						{/* Label */}
						<span className='truncate'>{node.label}</span>
					</div>

					{/* More Options */}
					<DropdownMenuTrigger asChild>
						<Button variant='ghost' size='icon' className='h-5 w-5 p-0 hover:bg-muted rounded-sm' onClick={e => e.stopPropagation()} tabIndex={-1}>
							<MoreHorizontal className='h-4 w-4' />
						</Button>
					</DropdownMenuTrigger>
				</div>
				<TreeNodeMenu node={node} />
			</DropdownMenu>

			{hasChildren && isExpanded && (
				<div role='group'>
					{node.children!.map(child => (
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
							autoExpandTimeoutRef={autoExpandTimeoutRef}
						/>
					))}
				</div>
			)}

			{dropIndicator?.targetId === node.id && dropIndicator.position === 'below' && <div className='h-0.5 bg-accent w-full -mb-px' />}
		</>
	);
};

type NodeMenuProps = {
	node: TreeNode;
};

const TreeNodeMenu: React.FC<NodeMenuProps> = ({ node }) => {
	return (
		<DropdownMenuContent align='end' side='right' className='min-w-[140px]' onClick={e => e.stopPropagation()}>
			<DropdownMenuItem onClick={() => console.log('Rename', node)}>Rename</DropdownMenuItem>

			<DropdownMenuItem onClick={() => console.log('Delete', node)}>Delete</DropdownMenuItem>

			<DropdownMenuItem onClick={() => console.log('New File', node)}>New File</DropdownMenuItem>

			<DropdownMenuItem onClick={() => console.log('New Folder', node)}>New Folder</DropdownMenuItem>
		</DropdownMenuContent>
	);
};

/* ------------------------------------------------------
   UTILITIES
------------------------------------------------------- */

function initExpanded(nodes: TreeNode[]) {
	const out: Record<string, boolean> = {};
	const walk = (arr: TreeNode[]) => {
		arr.forEach(n => {
			if (n.defaultExpanded) out[n.id] = true;
			if (n.children) walk(n.children);
		});
	};
	walk(nodes);
	return out;
}

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
	for (const n of nodes) {
		if (n.id === id) return n;
		if (n.children) {
			const f = findNode(n.children, id);
			if (f) return f;
		}
	}
	return null;
}

function removeNode(nodes: TreeNode[], id: string): TreeNode | null {
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].id === id) return nodes.splice(i, 1)[0];
		if (nodes[i].children) {
			const child = removeNode(nodes[i].children!, id);
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
		if (nodes[i].children && insertBefore(nodes[i].children!, targetId, item)) return true;
	}
	return false;
}

function insertAfter(nodes: TreeNode[], targetId: string, item: TreeNode): boolean {
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].id === targetId) {
			nodes.splice(i + 1, 0, item);
			return true;
		}
		if (nodes[i].children && insertAfter(nodes[i].children!, targetId, item)) return true;
	}
	return false;
}

/* ------------------------------------------------------
   ARIA-HIDDEN GUARD
   Check if an element (or its ancestor) is aria-hidden
------------------------------------------------------- */

function isElementHidden(el: HTMLElement | null): boolean {
	if (!el) return true;
	// closest will search up the ancestor chain; if any ancestor has aria-hidden="true", treat as hidden
	return el.closest('[aria-hidden="true"]') !== null;
}
