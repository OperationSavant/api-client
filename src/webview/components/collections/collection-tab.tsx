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

	const createCollection = () => {
		// sendToExtension({ source: 'webviewView', command: 'createCollection', name: 'New Collection' });
		sendToExtension({ source: 'webviewView', command: CLIENT_COMMANDS.OPEN_COLLECTION_VIEW });
	};

	const openExistingrequest = ({ request, collectionId }: { request: Request; collectionId: string }) => {
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
				onSelect={node => {
					if (node.type === 'file') {
						openExistingrequest({ request: node?.metadata?.request, collectionId: node.id });
					}
				}}
				onNewFile={parentNode => addFolder(parentNode, 'File')}
				onNewFolder={parentNode => addFolder(parentNode, 'Folder')}
			/>
		</div>
	);
};
