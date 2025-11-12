import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ApiClientInput } from '../api-client-input';
import ApiClientButton from '../api-client-button';
import { ApiClientSelect } from '../api-client-select';
import ApiClientFieldRow from '../api-client-field-row';
import { CollectionRequest, CollectionFolder, SaveRequestPayload } from '@/shared/types/collection';
import { arrayToRecord } from '@/shared/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Folder, ListFilter } from 'lucide-react';
import { MarkdownEditor } from '../../editor/markdown-editor';

interface SaveRequestDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (payload: SaveRequestPayload) => void;
	onCreateCollection: (name: string) => void;
}

const CollectionTreeView: React.FC<{ items: (CollectionRequest | CollectionFolder)[]; filter: string }> = ({ items, filter }) => {
	if (!items) return null;

	const filteredItems = items.filter(item => item.name.toLowerCase().includes(filter.toLowerCase()));

	return (
		<ul className='space-y-1'>
			{filteredItems.map(item => (
				<li key={item.id} className='flex items-center gap-2 text-sm text-muted-foreground'>
					{'method' in item ? <FileText className='h-4 w-4 shrink-0' /> : <Folder className='h-4 w-4 shrink-0' />}
					<span className='truncate'>{item.name}</span>
				</li>
			))}
		</ul>
	);
};

export const ApiClientSaveRequestDialog: React.FC<SaveRequestDialogProps> = ({ isOpen, onClose, onSave, onCreateCollection }) => {
	const { collections } = useSelector((state: RootState) => state.collections);
	const requestState = useSelector((state: RootState) => state.request);
	const paramsState = useSelector((state: RootState) => state.requestParams);
	const headersState = useSelector((state: RootState) => state.requestHeaders);
	const bodyState = useSelector((state: RootState) => state.requestBody);

	const [requestName, setRequestName] = useState('');
	const [description, setDescription] = useState('');
	const [showDescription, setShowDescription] = useState(false);
	const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>();
	const [isCreatingCollection, setIsCreatingCollection] = useState(false);
	const [newCollectionName, setNewCollectionName] = useState('');
	const [filterText, setFilterText] = useState('');

	const selectedCollection = useMemo(() => {
		return collections.find(c => c.id === selectedCollectionId);
	}, [selectedCollectionId, collections]);

	useEffect(() => {
		if (isOpen) {
			setRequestName(requestState.name || 'New Request');
			setDescription(requestState.description || '');
			if (requestState.collectionId && collections.some(c => c.id === requestState.collectionId)) {
				setSelectedCollectionId(requestState.collectionId);
			} else if (collections.length > 0) {
				setSelectedCollectionId(collections[0].id);
			} else {
				setSelectedCollectionId(undefined);
			}
		} else {
			setIsCreatingCollection(false);
			setNewCollectionName('');
			setFilterText('');
		}
	}, [isOpen, requestState, collections]);

	const handleCreateCollection = () => {
		if (!newCollectionName.trim()) return;
		onCreateCollection(newCollectionName);
		setIsCreatingCollection(false);
		setNewCollectionName('');
	};

	const handleSave = () => {
		if (!selectedCollectionId) return;
		onSave({
			collectionId: selectedCollectionId,
			requestId: requestState.id,
			request: {
				name: requestName,
				description: description,
				method: requestState.method,
				url: requestState.url,
				auth: requestState.auth,
				body: bodyState.config,
				headers: arrayToRecord(headersState.headers),
				params: arrayToRecord(paramsState.params),
				...(bodyState.config.type === 'graphql' && { operationName: bodyState.config.graphql.operationName }),
			},
		});
	};

	const renderDescription = () => {
		setShowDescription(!showDescription);
		if (!showDescription) {
			setDescription('');
		}
	};

	const renderCreateCollection = () => (
		<div className='p-4 border border-dashed rounded-md'>
			{isCreatingCollection ? (
				<div className='space-y-2'>
					<p className='text-sm text-muted-foreground'>Create a new collection to save this request.</p>
					<ApiClientInput placeholder='New collection name...' value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} autoFocus />
					<div className='flex justify-end gap-2'>
						<ApiClientButton variant='ghost' size='sm' onClick={() => setIsCreatingCollection(false)}>
							Cancel
						</ApiClientButton>
						<ApiClientButton size='sm' onClick={handleCreateCollection} disabled={!newCollectionName.trim()}>
							Create
						</ApiClientButton>
					</div>
				</div>
			) : (
				<div className='text-center'>
					<p className='text-sm text-muted-foreground'>No collections found.</p>
					<ApiClientButton variant='link' size='sm' onClick={() => setIsCreatingCollection(true)}>
						Create a new Collection
					</ApiClientButton>
				</div>
			)}
		</div>
	);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='w-[80vw]! max-w-[80vw]! min-h-0! flex flex-col'>
				<DialogHeader>
					<DialogTitle>Save Request</DialogTitle>
					<DialogDescription>Save the current request to a collection to reuse it later.</DialogDescription>
				</DialogHeader>
				<div className='flex flex-col gap-y-4 py-2 h-full'>
					<div className='flex flex-col gap-y-4 h-full'>
						<ApiClientFieldRow label='Request Name' htmlFor='request-name'>
							<ApiClientInput id='request-name' value={requestName} onChange={e => setRequestName(e.target.value)} placeholder='e.g., Get User Details' />
						</ApiClientFieldRow>
						<ApiClientFieldRow showLabel={false}>
							<ApiClientButton variant='link' onClick={renderDescription} className='p-0'>
								{showDescription ? 'Remove' : 'Add'} Description
							</ApiClientButton>
						</ApiClientFieldRow>
						<div className={`transition-all duration-300 ease-in-out overflow-hidden ${showDescription ? 'max-h-44 opacity-100' : 'max-h-0 opacity-0'}`}>
							<ApiClientFieldRow label='Description' htmlFor='request-description' optional className='h-full items-start transition'>
								<div className='flex flex-col w-full h-full'>
									<MarkdownEditor value={description} onChange={setDescription} placeholder='A short description of what this request does.' />
								</div>
							</ApiClientFieldRow>
						</div>
					</div>
					<div className='space-y-4'>
						<ApiClientFieldRow label='Save to Collection' htmlFor='collection-select'>
							<ApiClientSelect
								placeholder='Select a collection'
								options={collections.map(c => ({ label: c.name, value: c.id }))}
								onValueChange={value => setSelectedCollectionId(value)}
								classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
								classNameContent={`w-full`}
							/>
							{/* {renderCreateCollection()} */}
						</ApiClientFieldRow>
						{selectedCollection && (
							<div className='space-y-2 border border-input rounded-md'>
								<div className='border-none relative w-full'>
									<ListFilter className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
									<ApiClientInput
										placeholder='Search for collection or folder'
										value={filterText}
										onChange={e => setFilterText(e.target.value)}
										className='border-0 border-b border-b-input pl-10 bg-muted-foreground/10'
									/>
								</div>
								<ScrollArea className='min-h-3/4 h-52 border-none rounded-md border'>
									<div className='p-4 border-none'>
										<CollectionTreeView items={[...selectedCollection.folders, ...selectedCollection.requests]} filter={filterText} />
									</div>
								</ScrollArea>
							</div>
						)}
					</div>
				</div>
				<DialogFooter>
					<ApiClientButton variant='ghost' onClick={onClose} content='Cancel' />
					<ApiClientButton onClick={handleSave} disabled={!requestName || !selectedCollectionId} content='Save' />
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
