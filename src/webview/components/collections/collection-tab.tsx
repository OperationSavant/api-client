import { useTreeData } from '@/hooks/use-tree-data';
import type { TreeNode } from '@/shared/types/tree-node';
import type { RootState} from '@/store/sidebar-store';
import { useAppDispatch } from '@/store/sidebar-store';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { TreeView } from '../custom/api-client-tree-view';
import { createDefaultRequest } from '@/shared/types/request';

interface CollectionTabProps {
	sendToExtension: (message: any) => void;
}

export const CollectionTab: React.FC<CollectionTabProps> = ({ sendToExtension }) => {
	const dispatch = useAppDispatch();
	const dbCollections = useSelector((state: RootState) => state.sidebarCollections.collections);
	const treeData = useTreeData(dbCollections);

	function updateNodeLabel(nodes: TreeNode[], nodeId: string, newLabel: string): TreeNode[] {
		return nodes.map(node => {
			if (node.id === nodeId) {
				return { ...node, label: newLabel };
			}
			if (node.type === 'folder' && node.children) {
				return { ...node, children: updateNodeLabel(node.children, nodeId, newLabel) };
			}
			return node;
		});
	}

	function removeNodeById(nodes: TreeNode[], nodeId: string): TreeNode[] {
		return nodes
			.filter(node => node.id !== nodeId)
			.map(node => {
				if (node.type === 'folder' && node.children) {
					return { ...node, children: removeNodeById(node.children, nodeId) };
				}
				return node;
			});
	}

	function addChildToNode(nodes: TreeNode[], parentNode: TreeNode, newChild: TreeNode): TreeNode[] {
		return nodes.map(node => {
			if (node.id === parentNode.id && node.type === 'folder') {
				// return {
				// 	...node,
				// 	children: [...(node.children || []), newChild],
				// };
				// sendToExtension({
				// 	command: node?.type === 'folder' ? 'createFolder' : 'createNewRequest',
				// 	payload: {
				// 		collectionId: parentNode.metadata?.collection?.id,
				// 		name: newChild.label,
				// 	},
				// 	source: 'webviewView',
				// });
				console.log('Adding child to node:', node.label, 'Child:', JSON.stringify(newChild));
			}
			if (node.type === 'folder' && node.children) {
				console.log('Recursing into folder:', JSON.stringify(node));
				// return { ...node, children: addChildToNode(node.children, parentNode, newChild) };
			}
			return node;
		});
	}

	const addFolder = (parentNode: TreeNode, type: 'File' | 'Folder') => {
		if (type === 'Folder') {
			sendToExtension({
				command: 'createFolder',
				payload: {
					collectionId: parentNode.collectionId,
					name: 'New Folder',
					parentId: parentNode.type === 'folder' && parentNode.id !== parentNode.collectionId ? parentNode.id : undefined,
				},
				source: 'webviewView',
			});
		} else {
			sendToExtension({
				command: 'saveRequest',
				payload: {
					collectionId: parentNode.collectionId,
					request: { ...createDefaultRequest(), name: 'New Request' },
					folderId: parentNode.type === 'folder' && parentNode.id !== parentNode.collectionId ? parentNode.id : undefined,
				},
				source: 'webviewView',
			});
		}
	};

	const createCollection = () => {
		// sendToExtension({ source: 'webviewView', command: 'createCollection', name: 'New Collection' });
		sendToExtension({ source: 'webviewView', command: 'openCollectionView' });
	};

	function generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	const openExistingrequest = ({ request, collectionId }: { request: any; collectionId: string }) => {
		sendToExtension({
			command: 'openRequest',
			args: [{ request, collectionId }],
			source: 'webviewView',
		});
	};

	return (
		<div className='flex flex-col gap-4 h-full'>
			<TreeView
				data={treeData}
				onCreateCollection={createCollection}
				searchable={true}
				// onChange={setCollections}
				expandOnRowClick={true}
				onSelect={node => {
					if (node.type === 'file') {
						// Load request into editor
						openExistingrequest({ request: node?.metadata?.request, collectionId: node.id });
					}
				}}
				onRename={(node, newLabel) => {
					// Handle rename
					// const updated = updateNodeLabel(collections, node.id, newLabel);
					// setCollections(updated);
				}}
				onDelete={node => {
					// Handle delete
					// const updated = removeNodeById(collections, node.id);
					// setCollections(updated);
				}}
				onNewFile={parentNode => {
					// const id = generateId();
					// // Handle new file
					// const updated = addChildToNode(collections, parentNode, {
					// 	type: 'file',
					// 	id,
					// 	label: 'New Request',
					// 	metadata: { id, ...createDefaultRequest() },
					// });
					// setCollections(updated);
					addFolder(parentNode, 'File');
				}}
				onNewFolder={parentNode => {
					// Handle new folder
					// const updated = addChildToNode(collections, parentNode, {
					// 	type: 'folder',
					// 	id: generateId(),
					// 	label: 'New Folder',
					// 	children: [],
					// });
					// setCollections(updated);
					addFolder(parentNode, 'Folder');
				}}
			/>
		</div>
	);
};
