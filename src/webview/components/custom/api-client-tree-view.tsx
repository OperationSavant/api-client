'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { UncontrolledTreeEnvironment, Tree, type TreeItemIndex, type TreeItem, type TreeRef, type TreeViewState, TreeDataProvider } from 'react-complex-tree';
import { ChevronDown, ChevronRight, Copy, FilePlus, Files, Folder, FolderOpen, FolderPlus, MoreHorizontal, MoveRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/lib/utils';
import ApiClientButton from './api-client-button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

const treeData: Record<TreeItemIndex, TreeItem> = {
	root: {
		index: 'root',
		isFolder: true,
		children: ['item1', 'item9', 'item32', 'item35'],
		data: 'root',
	},
	item1: {
		index: 'item1',
		isFolder: true,
		children: ['item2', 'item3', 'item4', 'item5', 'item8'],
		data: 'Fruit',
	},
	item2: {
		index: 'item2',
		isFolder: false,
		data: 'Apple',
	},
	item3: {
		index: 'item3',
		isFolder: false,
		data: 'Orange',
	},
	item4: {
		index: 'item4',
		isFolder: false,
		data: 'Lemon',
	},
	item5: {
		index: 'item5',
		isFolder: true,
		children: ['item6', 'item7'],
		data: 'Berries',
	},
	item6: {
		index: 'item6',
		isFolder: false,
		data: 'Strawberry',
	},
	item7: {
		index: 'item7',
		isFolder: false,
		data: 'Blueberry',
	},
	item8: {
		index: 'item8',
		isFolder: false,
		data: 'Banana',
	},
	item9: {
		index: 'item9',
		isFolder: true,
		children: ['item10', 'item16', 'item22', 'item27'],
		data: 'Meals',
	},
	item10: {
		index: 'item10',
		isFolder: true,
		children: ['item11', 'item12', 'item13', 'item14', 'item15'],
		data: 'America',
	},
	item11: {
		index: 'item11',
		isFolder: false,
		data: 'SmashBurger',
	},
	item12: {
		index: 'item12',
		isFolder: false,
		data: 'Chowder',
	},
	item13: {
		index: 'item13',
		isFolder: false,
		data: 'Ravioli',
	},
	item14: {
		index: 'item14',
		isFolder: false,
		data: 'MacAndCheese',
	},
	item15: {
		index: 'item15',
		isFolder: false,
		data: 'Brownies',
	},
	item16: {
		index: 'item16',
		isFolder: true,
		children: ['item17', 'item18', 'item19', 'item20', 'item21'],
		data: 'Europe',
	},
	item17: {
		index: 'item17',
		isFolder: false,
		data: 'Risotto',
	},
	item18: {
		index: 'item18',
		isFolder: false,
		data: 'Spaghetti',
	},
	item19: {
		index: 'item19',
		isFolder: false,
		data: 'Pizza',
	},
	item20: {
		index: 'item20',
		isFolder: false,
		data: 'Weisswurst',
	},
	item21: {
		index: 'item21',
		isFolder: false,
		data: 'Spargel',
	},
	item22: {
		index: 'item22',
		isFolder: true,
		children: ['item23', 'item24', 'item25', 'item26'],
		data: 'Asia',
	},
	item23: {
		index: 'item23',
		isFolder: false,
		data: 'Curry',
	},
	item24: {
		index: 'item24',
		isFolder: false,
		data: 'PadThai',
	},
	item25: {
		index: 'item25',
		isFolder: false,
		data: 'Jiaozi',
	},
	item26: {
		index: 'item26',
		isFolder: false,
		data: 'Sushi',
	},
	item27: {
		index: 'item27',
		isFolder: true,
		children: ['item28', 'item29', 'item30', 'item31'],
		data: 'Australia',
	},
	item28: {
		index: 'item28',
		isFolder: false,
		data: 'PotatoWedges',
	},
	item29: {
		index: 'item29',
		isFolder: false,
		data: 'PokeBowl',
	},
	item30: {
		index: 'item30',
		isFolder: false,
		data: 'Curd',
	},
	item31: {
		index: 'item31',
		isFolder: false,
		data: 'KumaraFries',
	},
	item32: {
		index: 'item32',
		isFolder: true,
		children: ['item33', 'item34'],
		data: 'Desserts',
	},
	item33: {
		index: 'item33',
		isFolder: false,
		data: 'Cookies',
	},
	item34: {
		index: 'item34',
		isFolder: false,
		data: 'IceCream',
	},
	item35: {
		index: 'item35',
		isFolder: true,
		children: ['item36', 'item37', 'item38'],
		data: 'Drinks',
	},
	item36: {
		index: 'item36',
		isFolder: false,
		data: 'PinaColada',
	},
	item37: {
		index: 'item37',
		isFolder: false,
		data: 'Cola',
	},
	item38: {
		index: 'item38',
		isFolder: false,
		data: 'Juice',
	},
};

class CustomTreeDataProvider implements TreeDataProvider {
	private items: Record<TreeItemIndex, TreeItem>;
	constructor(items: Record<TreeItemIndex, TreeItem>) {
		this.items = items;
	}

	private treeChangeListeners: ((changedItemIds: TreeItemIndex[]) => void)[] = [];

	public async getTreeItem(itemId: TreeItemIndex) {
		const item = this.items[itemId];
		if (!item) {
			return {
				index: itemId,
				isFolder: false,
				data: `Unknown Item: ${itemId}` as string,
			};
		}
		return item;
	}

	public async onChangeItemChildren(itemId: TreeItemIndex, newChildren: TreeItemIndex[]) {
		this.items[itemId].children = newChildren;
		this.treeChangeListeners.forEach(listener => listener([itemId]));
	}

	public onDidChangeTreeData(listener: (changedItemIds: TreeItemIndex[]) => void) {
		this.treeChangeListeners.push(listener);
		return {
			dispose: () => {
				const index = this.treeChangeListeners.indexOf(listener);
				if (index > -1) this.treeChangeListeners.splice(index, 1);
			},
		};
	}

	public async onRenameItem(item: TreeItem, name: string) {
		this.items[item.index].data = name;
	}

	public injectItem(name: string) {
		const rand = `${Math.random()}`;
		this.items[rand] = { data: name, index: rand } as TreeItem;
		this.items.root.children?.push(rand);
		this.treeChangeListeners.forEach(listener => listener(['root']));
	}
}

const viewStateInitial: TreeViewState = {
	'tree-sample': {},
};

const TreeView: React.FC = () => {
	const tree = useRef<TreeRef>(null);
	const [viewState, setViewState] = useState<TreeViewState>(viewStateInitial);
	const [search, setSearch] = useState<string | undefined>('');
	const [openMenuItem, setOpenMenuItem] = useState<TreeItemIndex | null>(null);

	const dataProvider = useMemo(() => new CustomTreeDataProvider(treeData), []);

	const getItemPath = useCallback(
		async (search: string, searchRoot: TreeItemIndex = 'root'): Promise<TreeItemIndex[] | null> => {
			const item = await dataProvider.getTreeItem(searchRoot);

			if (item.data.toLowerCase().includes(search.toLowerCase())) {
				return [item.index];
			}

			const searchedItems = await Promise.all(item.children?.map(child => getItemPath(search, child)) ?? []);

			const result = searchedItems.find(item => item !== null);
			if (!result) {
				return null;
			}

			return [item.index, ...result];
		},
		[dataProvider]
	);

	const onSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if (search) {
				getItemPath(search)
					.then(path => {
						if (path) {
							return tree.current?.expandSubsequently(path).then(() => {
								tree.current?.selectItems([...[path.at(-1) ?? '']]);
								tree.current?.focusItem(path.at(-1) ?? '');
								// tree.current?.toggleItemSelectStatus(path.at(-1) ?? '');
							});
						}
					})
					.catch(error => {
						console.error('Error getting item:', error);
					});
			}
		},
		[getItemPath, search]
	);

	return (
		<div className='flex w-full flex-1 flex-col gap-2 min-h-0'>
			<form onSubmit={onSubmit} className='flex items-center justify-start gap-2'>
				<Input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search...' />
				<Button type='submit'>Search</Button>
			</form>
			<UncontrolledTreeEnvironment
				dataProvider={dataProvider}
				getItemTitle={item => item.data}
				canSearch={true}
				canSearchByStartingTyping={true}
				canRename={false}
				viewState={viewState}
				canDragAndDrop={true}
				canReorderItems={true}
				canDropOnFolder={true}
				canDropOnNonFolder={true}
				renderTreeContainer={({ children, containerProps }) => {
					return (
						<div {...containerProps} className='w-full h-full overflow-y-auto [scrollbar-gutter:stable] pl-4 pr-1'>
							{children}
						</div>
					);
				}}
				renderLiveDescriptorContainer={() => <></>}
				renderItemsContainer={({ children, containerProps }) => {
					return (
						<ul {...containerProps} className='space-y-1 w-full'>
							{children}
						</ul>
					);
				}}
				renderItem={({ title, item, arrow, context, depth, children, info }) => {
					const indentation = 10 * depth;
					return (
						<li {...context.itemContainerWithChildrenProps}>
							<div
								className='flex items-center justify-between bg-background group'
								onContextMenu={e => {
									e.preventDefault();
									e.stopPropagation();
									setOpenMenuItem(item.index);
								}}>
								{item.isFolder && (
									<div
										className={cn(
											'flex gap-2 items-center h-9 pr-2 transition-colors duration-100 group-hover:bg-muted-foreground/10!',
											openMenuItem === item.index && 'bg-red-600!'
										)}>
										{arrow}
									</div>
								)}
								<ApiClientButton
									{...context.itemContainerWithoutChildrenProps}
									{...context.interactiveElementProps}
									type='button'
									variant='ghost'
									size='sm'
									className={cn(
										'flex h-9 flex-1 items-center gap-1.5 border-none text-xs shadow-none justify-start bg-transparent rounded-none transition-colors duration-100',
										'group-hover:bg-muted-foreground/10!',
										openMenuItem === item.index && 'bg-red-600!'
									)}
									style={{ paddingLeft: `${item.isFolder ? indentation : indentation + 24}px` }}
									onKeyDown={e => {
										if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10') || (e.altKey && e.key === 'ArrowDown')) {
											e.preventDefault();
											setOpenMenuItem(item.index);
										}
									}}>
									<span className='capitalize'>{title}</span>
								</ApiClientButton>
								<DropdownMenu open={openMenuItem === item.index} onOpenChange={open => setOpenMenuItem(open ? item.index : null)}>
									<DropdownMenuTrigger asChild>
										<span
											tabIndex={-1}
											aria-label='More actions'
											className={cn(
												`inline-flex w-8 h-9 items-center justify-center rounded-none opacity-0 transition-colors duration-100 group-hover:opacity-100 group-hover:bg-muted-foreground/10! cursor-pointer`,
												openMenuItem === item.index && 'bg-red-600! opacity-100'
											)}
											onPointerDown={e => {
												e.stopPropagation();
											}}
											onClick={e => {
												e.stopPropagation();
											}}
											onKeyDown={e => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													e.stopPropagation();
												}
											}}>
											<MoreHorizontal className={cn('w-8 h-4 px-1 rounded-sm', openMenuItem === item.index && 'text-foreground bg-muted-foreground/20!')} />
										</span>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' onPointerDown={e => e.stopPropagation()} onPointerDownOutside={e => {}}>
										<DropdownMenuGroup>
											<DropdownMenuItem onClick={e => {}}>
												<FilePlus className='h-4 w-4 mr-2' />
												Add New Request
											</DropdownMenuItem>
											<DropdownMenuItem>
												<FolderPlus className='h-4 w-4 mr-2' />
												Add New Folder
											</DropdownMenuItem>
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
										<DropdownMenuGroup>
											<DropdownMenuItem>
												<Pencil className='h-4 w-4 mr-2' />
												Rename
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Files className='h-4 w-4 mr-2' />
												Duplicate
											</DropdownMenuItem>
											<DropdownMenuItem variant='destructive'>
												<Trash2 className='h-4 w-4 mr-2' />
												Delete
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className='mt-1'>{children}</div>
						</li>
					);
				}}
				renderItemArrow={({ context }) => {
					return context.isExpanded ? (
						<>
							<ChevronDown {...context.arrowProps} className={cn('size-3.5!')} />
							<FolderOpen stroke='#dcb67a' className={cn('size-3.5!')} />
						</>
					) : (
						<>
							<ChevronRight {...context.arrowProps} className={cn('size-3.5!')} />
							<Folder fill='#c09553' stroke='#c09553' className={cn('size-3.5!')} />
						</>
					);
				}}
				renderItemTitle={({ title }) => <span>{title}</span>}>
				<Tree ref={tree} treeId='tree-sample' rootItem='root' treeLabel='Sample Tree' />
			</UncontrolledTreeEnvironment>
		</div>
	);
};

export default TreeView;
