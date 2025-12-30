import { useTreeData } from '@/hooks/use-tree-data';
import type { TreeNode } from '@/shared/types/tree-node';
import type { RootState } from '@/store/sidebar-store';
import React from 'react';
import { useSelector } from 'react-redux';
import { TreeView } from '../custom/api-client-tree-view';
import type { Request } from '@/shared/types/request';
import { createDefaultRequest } from '@/shared/types/request';
import type { MessageEnvelope } from '@/shared/types/webview-messages';
import { CLIENT_COMMANDS } from '@/shared/constants/commands';
import type { Collection, CollectionFolder } from '@/shared/types/collection';

interface CollectionTabProps {
	sendToExtension: (message: MessageEnvelope) => void;
}

export const CollectionTab: React.FC<CollectionTabProps> = ({ sendToExtension }) => {
	const dbCollections = useSelector((state: RootState) => state.sidebarCollections.collections);
	const treeData = useTreeData(dbCollections);

	const addFolder = (parentNode: TreeNode, type: 'File' | 'Folder') => {
		if (type === 'Folder') {
			sendToExtension({
				command: CLIENT_COMMANDS.CREATE_FOLDER,
				payload: {
					collectionId: parentNode.collectionId,
					name: 'New Folder',
					parentId: parentNode.type === 'folder' && parentNode.id !== parentNode.collectionId ? parentNode.id : undefined,
				},
				source: 'webviewView',
			});
		} else {
			//TODO: Create new request under the parent folder(which can be a collection or a folder inside a collection or a nested folder inside a collection) then open it in editor and then save to collection
			sendToExtension({
				command: CLIENT_COMMANDS.SAVE_REQUEST,
				payload: {
					collectionId: parentNode.collectionId,
					request: { ...createDefaultRequest(), name: 'New Request' },
					folderId: parentNode.type === 'folder' && parentNode.id !== parentNode.collectionId ? parentNode.id : undefined,
				},
				source: 'webviewView',
			});
		}
	};

	const updateCollection = (id: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>) => {
		sendToExtension({
			command: CLIENT_COMMANDS.UPDATE_COLLECTION,
			payload: { id, updates },
			source: 'webviewView',
		});
	};

	const updateFolder = (collectionId: string, folderId: string, updates: Partial<Omit<CollectionFolder, 'id'>>) => {
		sendToExtension({
			command: CLIENT_COMMANDS.UPDATE_FOLDER,
			payload: { collectionId, folderId, updates },
			source: 'webviewView',
		});
	};

	const deleteFolder = (collectionId: string, folderId: string) => {
		sendToExtension({
			command: CLIENT_COMMANDS.DELETE_FOLDER,
			payload: { collectionId, folderId },
			source: 'webviewView',
		});
	};

	const createCollection = () => {
		// sendToExtension({ source: 'webviewView', command: 'createCollection', name: 'New Collection' });
		sendToExtension({ source: 'webviewView', command: CLIENT_COMMANDS.OPEN_COLLECTION_VIEW });
	};

	const openExistingrequest = ({ request, collectionId }: { request: Request & { id: string; name: string }; collectionId: string }) => {
		sendToExtension({
			command: CLIENT_COMMANDS.OPEN_REQUEST,
			payload: [{ request, collectionId }],
			source: 'webviewView',
		});
	};

	return (
		<div className='flex flex-col gap-4 h-full'>
			<TreeView
				data={treeData}
				onCreateCollection={createCollection}
				searchable={true}
				expandOnRowClick={true}
				onRename={node => {
					if (node.type === 'folder') {
						if (node.id === node.collectionId) {
							updateCollection(node.id, { name: node.label });
						}
						if (node.id !== node.collectionId) {
							updateFolder(node.collectionId, node.id, { name: node.label });
						}
					}
				}}
				onSelect={node => {
					if (node.type === 'file') {
						openExistingrequest({ request: node?.metadata?.request, collectionId: node.id });
					}
				}}
				onDelete={node => {
					if (node.type === 'folder') {
						deleteFolder(node.collectionId, node.id);
					}
				}}
				onNewFile={parentNode => addFolder(parentNode, 'File')}
				onNewFolder={parentNode => addFolder(parentNode, 'Folder')}
			/>
		</div>
	);
};
