import { useMemo, useCallback, useRef } from 'react';
import type { Collection, CollectionFolder, CollectionRequest } from '@/shared/types/collection';
import type { FileNode, FolderNode, TreeNode } from '@/shared/types/tree-node';

export function useTreeData(collections: Collection[]): TreeNode[] {
	// caches persist across renders — keep stable node objects when possible
	const folderCacheRef = useRef(new Map<string, FolderNode>());
	const fileCacheRef = useRef(new Map<string, FileNode>());

	return useMemo(() => {
		// clear caches only if you want to (optional)
		// folderCacheRef.current.clear();
		// fileCacheRef.current.clear();

		const folderCache = folderCacheRef.current;
		const fileCache = fileCacheRef.current;

		// map a request -> FileNode (use cache by id, and check label for change)
		function mapRequest(req: CollectionRequest): FileNode {
			const cached = fileCache.get(req.id);
			if (cached && cached.label === req.name) {
				return cached;
			}

			const node: FileNode = {
				collectionId: req.collectionId,
				id: req.id,
				type: 'file',
				label: req.name,
				metadata: { request: req },
			};

			fileCache.set(req.id, node);
			return node;
		}

		// recursive: map a folder -> FolderNode
		// uses folderCache and mapRequest/mapFolder to build children
		function mapFolder(folder: CollectionFolder): FolderNode {
			const cached = folderCache.get(folder.id);

			// build children (subfolders first, then folder requests — that matches your rules)
			const mappedChildren: TreeNode[] = [...folder.subfolders.map(mapFolder), ...folder.requests.map(mapRequest)];

			// If cached node exists and nothing changed, return cached to preserve identity
			if (cached && cached.label === folder.name && shallowEqualChildren(cached.children, mappedChildren)) {
				return cached;
			}

			const node: FolderNode = {
				collectionId: folder.collectionId,
				id: folder.id,
				type: 'folder',
				label: folder.name,
				children: mappedChildren,
				// defaultExpanded is optional; only include if you have a source of truth for it
				// defaultExpanded: !folder.collapsed // if you have collapsed flag
				metadata: { folder },
			};

			folderCache.set(folder.id, node);
			return node;
		}

		// top-level collection -> FolderNode (collection is always a folder node)
		function mapCollection(col: Collection): FolderNode {
			const mappedChildren: TreeNode[] = [...col.folders.map(mapFolder), ...col.requests.map(mapRequest)];

			// We typically don't cache collections here (but you can if you want).
			const node: FolderNode = {
				collectionId: col.id,
				id: col.id,
				type: 'folder',
				label: col.name,
				children: mappedChildren,
				metadata: { collection: col },
			};

			return node;
		}

		// build and return final tree
		return collections.map(mapCollection);
	}, [collections]); // rebuild only when collections reference changes
}

function shallowEqualChildren(a: TreeNode[], b: TreeNode[]): boolean {
	if (a === b) return true;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false; // compare by reference — intentional for stable identity
	}
	return true;
}
