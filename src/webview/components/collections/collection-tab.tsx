import { useTreeData } from '@/hooks/use-tree-data';
import { TreeNode } from '@/shared/types/tree-node';
import { RootState, useAppDispatch } from '@/store/sidebar-store';
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
	const [collections, setCollections] = useState<TreeNode[]>(treeData);
	useEffect(() => {
		setCollections(treeData);
	}, [treeData]);

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

	function addChildToNode(nodes: TreeNode[], parentId: string, newChild: TreeNode): TreeNode[] {
		return nodes.map(node => {
			if (node.id === parentId && node.type === 'folder') {
				return {
					...node,
					children: [...(node.children || []), newChild],
				};
			}
			if (node.type === 'folder' && node.children) {
				return { ...node, children: addChildToNode(node.children, parentId, newChild) };
			}
			return node;
		});
	}

	function generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	return (
		<div className='flex flex-col gap-4 h-full'>
			<TreeView
				data={collections}
				searchable={true}
				onChange={setCollections}
				expandOnRowClick={true}
				onSelect={node => {
					if (node.type === 'file') {
						// Load request into editor
						sendToExtension({
							command: 'openRequest',
							commandId: 'apiClient.openRequest',
							args: [{ request: node?.metadata?.request, collectionId: node.id }],
							source: 'webviewView',
						});
					}
				}}
				onRename={(node, newLabel) => {
					// Handle rename
					const updated = updateNodeLabel(collections, node.id, newLabel);
					setCollections(updated);
				}}
				onDelete={node => {
					// Handle delete
					const updated = removeNodeById(collections, node.id);
					setCollections(updated);
				}}
				onNewFile={parentNode => {
					const id = generateId();
					// Handle new file
					const updated = addChildToNode(collections, parentNode.id, {
						type: 'file',
						id,
						label: 'New Request',
						metadata: { id, ...createDefaultRequest() },
					});
					setCollections(updated);
				}}
				onNewFolder={parentNode => {
					// Handle new folder
					const updated = addChildToNode(collections, parentNode.id, {
						type: 'folder',
						id: generateId(),
						label: 'New Folder',
						children: [],
					});
					setCollections(updated);
				}}
			/>
		</div>
	);
};
