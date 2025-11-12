// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { ChevronRight, ChevronDown, FolderOpen, Folder, FileText, Plus, Edit, Trash2, Save, X, MoreVertical } from 'lucide-react';
// import { Collection, CollectionTreeNode, CollectionFolder, CollectionRequest } from '@/shared/types/collection';
// import { collectionService } from '@/services/collectionService';

// interface CollectionTreeViewProps {
// 	collection: Collection;
// 	onRequestSelect?: (request: CollectionRequest) => void;
// 	selectedRequestId?: string;
// 	onCollectionUpdate?: (collection: Collection) => void;
// }

// interface TreeNodeProps {
// 	node: CollectionTreeNode;
// 	level: number;
// 	onToggle: (nodeId: string) => void;
// 	onRequestSelect?: (request: CollectionRequest) => void;
// 	selectedRequestId?: string;
// 	collectionId: string;
// 	onUpdate: () => void;
// }

// const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onToggle, onRequestSelect, selectedRequestId, collectionId, onUpdate }) => {
// 	const [isEditing, setIsEditing] = useState(false);
// 	const [editName, setEditName] = useState(node.name);
// 	const [showAddForm, setShowAddForm] = useState(false);
// 	const [addType, setAddType] = useState<'folder' | 'request'>('folder');
// 	const [newItemName, setNewItemName] = useState('');

// 	const hasChildren = node.children && node.children.length > 0;
// 	const isExpanded = !node.collapsed;
// 	const isSelected = node.type === 'request' && selectedRequestId === node.id;

// 	const handleEdit = () => {
// 		if (!editName.trim()) return;

// 		if (node.type === 'folder') {
// 			collectionService.updateFolder(collectionId, node.id, { name: editName.trim() });
// 		} else if (node.type === 'request') {
// 			collectionService.updateRequest(collectionId, node.id, { name: editName.trim() });
// 		}

// 		setIsEditing(false);
// 		onUpdate();
// 	};

// 	const handleDelete = () => {
// 		const itemType = node.type === 'folder' ? 'folder' : 'request';
// 		if (window.confirm(`Are you sure you want to delete this ${itemType}?`)) {
// 			if (node.type === 'folder') {
// 				collectionService.deleteFolder(collectionId, node.id);
// 			} else if (node.type === 'request') {
// 				collectionService.deleteRequest(collectionId, node.id);
// 			}
// 			onUpdate();
// 		}
// 	};

// 	const handleAdd = () => {
// 		if (!newItemName.trim()) return;

// 		if (addType === 'folder') {
// 			collectionService.createFolder(collectionId, newItemName.trim(), node.type === 'collection' ? undefined : node.id);
// 		} else {
// 			// For now, create a basic request structure
// 			const newRequest = {
// 				name: newItemName.trim(),
// 				method: 'GET',
// 				url: '',
// 				headers: {},
// 				params: {},
// 				description: '',
// 			};

// 			collectionService.createRequest(collectionId, newRequest, node.type === 'collection' ? undefined : node.id);
// 		}

// 		setNewItemName('');
// 		setShowAddForm(false);
// 		onUpdate();
// 	};

// 	const handleRequestClick = () => {
// 		if (node.type === 'request' && onRequestSelect) {
// 			const request = collectionService.getRequest(collectionId, node.id);
// 			if (request) {
// 				onRequestSelect(request);
// 			}
// 		}
// 	};

// 	const getIcon = () => {
// 		if (node.type === 'collection') return <FolderOpen className='h-4 w-4' />;
// 		if (node.type === 'folder') {
// 			return isExpanded ? <FolderOpen className='h-4 w-4' /> : <Folder className='h-4 w-4' />;
// 		}
// 		return <FileText className='h-4 w-4' />;
// 	};

// 	const getMethodBadge = () => {
// 		if (node.type === 'request' && node.metadata?.method) {
// 			const method = node.metadata.method;
// 			const colors = {
// 				GET: 'bg-green-500',
// 				POST: 'bg-blue-500',
// 				PUT: 'bg-orange-500',
// 				PATCH: 'bg-yellow-500',
// 				DELETE: 'bg-red-500',
// 				HEAD: 'bg-gray-500',
// 				OPTIONS: 'bg-purple-500',
// 			};

// 			return <Badge className={`text-xs px-1 py-0 text-white ${colors[method as keyof typeof colors] || 'bg-gray-500'}`}>{method}</Badge>;
// 		}
// 		return null;
// 	};

// 	return (
// 		<div>
// 			<div
// 				className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-accent/50 group ${isSelected ? 'bg-accent' : ''}`}
// 				style={{ paddingLeft: `${level * 16 + 8}px` }}>
// 				{/* Expand/Collapse Button */}
// 				{hasChildren && (
// 					<Button variant='ghost' size='sm' className='h-4 w-4 p-0' onClick={() => onToggle(node.id)}>
// 						{isExpanded ? <ChevronDown className='h-3 w-3' /> : <ChevronRight className='h-3 w-3' />}
// 					</Button>
// 				)}

// 				{/* Icon */}
// 				<div className='shrink-0'>{getIcon()}</div>

// 				{/* Name */}
// 				{isEditing ? (
// 					<div className='flex-1 flex gap-2'>
// 						<Input
// 							value={editName}
// 							onChange={e => setEditName(e.target.value)}
// 							onKeyDown={e => e.key === 'Enter' && handleEdit()}
// 							className='h-6 text-sm'
// 							autoFocus
// 						/>
// 						<Button size='sm' className='h-6 w-6 p-0' onClick={handleEdit}>
// 							<Save className='h-3 w-3' />
// 						</Button>
// 						<Button
// 							variant='outline'
// 							size='sm'
// 							className='h-6 w-6 p-0'
// 							onClick={() => {
// 								setIsEditing(false);
// 								setEditName(node.name);
// 							}}>
// 							<X className='h-3 w-3' />
// 						</Button>
// 					</div>
// 				) : (
// 					<div className='flex-1 flex items-center gap-2 cursor-pointer' onClick={handleRequestClick}>
// 						<span className='text-sm truncate'>{node.name}</span>
// 						{getMethodBadge()}
// 						{node.metadata?.url && <span className='text-xs text-muted-foreground truncate'>{node.metadata.url}</span>}
// 					</div>
// 				)}

// 				{/* Actions */}
// 				{!isEditing && (
// 					<div className='flex gap-1 opacity-0 group-hover:opacity-100'>
// 						{(node.type === 'folder' || node.type === 'collection') && (
// 							<Button variant='ghost' size='sm' className='h-6 w-6 p-0' onClick={() => setShowAddForm(true)}>
// 								<Plus className='h-3 w-3' />
// 							</Button>
// 						)}
// 						{node.type !== 'collection' && (
// 							<>
// 								<Button variant='ghost' size='sm' className='h-6 w-6 p-0' onClick={() => setIsEditing(true)}>
// 									<Edit className='h-3 w-3' />
// 								</Button>
// 								<Button variant='ghost' size='sm' className='h-6 w-6 p-0 text-destructive hover:text-destructive' onClick={handleDelete}>
// 									<Trash2 className='h-3 w-3' />
// 								</Button>
// 							</>
// 						)}
// 					</div>
// 				)}
// 			</div>

// 			{/* Add Form */}
// 			{showAddForm && (
// 				<div className='mt-2 p-2 border rounded bg-background' style={{ marginLeft: `${(level + 1) * 16}px` }}>
// 					<div className='space-y-2'>
// 						<div className='flex gap-2'>
// 							<Button variant={addType === 'folder' ? 'default' : 'outline'} size='sm' onClick={() => setAddType('folder')}>
// 								Folder
// 							</Button>
// 							<Button variant={addType === 'request' ? 'default' : 'outline'} size='sm' onClick={() => setAddType('request')}>
// 								Request
// 							</Button>
// 						</div>
// 						<Input
// 							placeholder={`${addType === 'folder' ? 'Folder' : 'Request'} name`}
// 							value={newItemName}
// 							onChange={e => setNewItemName(e.target.value)}
// 							onKeyDown={e => e.key === 'Enter' && handleAdd()}
// 							className='h-8'
// 							autoFocus
// 						/>
// 						<div className='flex gap-2'>
// 							<Button size='sm' onClick={handleAdd} disabled={!newItemName.trim()}>
// 								<Save className='h-3 w-3 mr-1' />
// 								Add
// 							</Button>
// 							<Button
// 								variant='outline'
// 								size='sm'
// 								onClick={() => {
// 									setShowAddForm(false);
// 									setNewItemName('');
// 								}}>
// 								<X className='h-3 w-3 mr-1' />
// 								Cancel
// 							</Button>
// 						</div>
// 					</div>
// 				</div>
// 			)}

// 			{/* Children */}
// 			{hasChildren && isExpanded && (
// 				<div>
// 					{node.children!.map(child => (
// 						<TreeNode
// 							key={child.id}
// 							node={child}
// 							level={level + 1}
// 							onToggle={onToggle}
// 							onRequestSelect={onRequestSelect}
// 							selectedRequestId={selectedRequestId}
// 							collectionId={collectionId}
// 							onUpdate={onUpdate}
// 						/>
// 					))}
// 				</div>
// 			)}
// 		</div>
// 	);
// };

// export const CollectionTreeView: React.FC<CollectionTreeViewProps> = ({ collection, onRequestSelect, selectedRequestId, onCollectionUpdate }) => {
// 	const [treeData, setTreeData] = useState<CollectionTreeNode | null>(null);
// 	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([collection.id]));

// 	useEffect(() => {
// 		loadTreeData();
// 	}, [collection]);

// 	const loadTreeData = () => {
// 		const tree = collectionService.getCollectionTree(collection.id);
// 		if (tree) {
// 			setTreeData(tree);
// 		}
// 	};

// 	const handleToggle = (nodeId: string) => {
// 		setExpandedNodes(prev => {
// 			const newSet = new Set(prev);
// 			if (newSet.has(nodeId)) {
// 				newSet.delete(nodeId);
// 			} else {
// 				newSet.add(nodeId);
// 			}
// 			return newSet;
// 		});

// 		// Update the collection data
// 		if (nodeId !== collection.id) {
// 			collectionService.updateFolder(collection.id, nodeId, {
// 				collapsed: expandedNodes.has(nodeId),
// 			});
// 		}
// 	};

// 	const handleUpdate = () => {
// 		loadTreeData();
// 		if (onCollectionUpdate) {
// 			const updatedCollection = collectionService.getCollection(collection.id);
// 			if (updatedCollection) {
// 				onCollectionUpdate(updatedCollection);
// 			}
// 		}
// 	};

// 	if (!treeData) {
// 		return (
// 			<Card className='h-full'>
// 				<CardContent className='p-4'>
// 					<div className='text-center text-muted-foreground'>Loading collection structure...</div>
// 				</CardContent>
// 			</Card>
// 		);
// 	}

// 	return (
// 		<Card className='h-full'>
// 			<CardHeader className='pb-3'>
// 				<CardTitle className='text-base'>{collection.name}</CardTitle>
// 				{collection.description && <p className='text-sm text-muted-foreground'>{collection.description}</p>}
// 			</CardHeader>
// 			<CardContent className='p-0'>
// 				<div className='max-h-96 overflow-y-auto force-scrollbar-visible'>
// 					<TreeNode
// 						node={treeData}
// 						level={0}
// 						onToggle={handleToggle}
// 						onRequestSelect={onRequestSelect}
// 						selectedRequestId={selectedRequestId}
// 						collectionId={collection.id}
// 						onUpdate={handleUpdate}
// 					/>
// 				</div>
// 			</CardContent>
// 		</Card>
// 	);
// };

// export default CollectionTreeView;
