import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FolderOpen, FileText, Calendar, Save, X } from 'lucide-react';
import { Collection, CollectionMetadata } from '@/types/collection';
import { collectionService } from '@/services/collectionService';

interface CollectionManagerProps {
	onCollectionSelect?: (collection: Collection) => void;
	selectedCollectionId?: string;
}

export const CollectionManager: React.FC<CollectionManagerProps> = ({ onCollectionSelect, selectedCollectionId }) => {
	const [collections, setCollections] = useState<Collection[]>([]);
	const [metadata, setMetadata] = useState<Map<string, CollectionMetadata>>(new Map());
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [newCollectionName, setNewCollectionName] = useState('');
	const [newCollectionDescription, setNewCollectionDescription] = useState('');

	useEffect(() => {
		loadCollections();
	}, []);

	const loadCollections = () => {
		const allCollections = collectionService.getAllCollections();
		setCollections(allCollections);

		// Load metadata for each collection
		const metadataMap = new Map<string, CollectionMetadata>();
		allCollections.forEach(collection => {
			const meta = collectionService.getCollectionMetadata(collection.id);
			if (meta) {
				metadataMap.set(collection.id, meta);
			}
		});
		setMetadata(metadataMap);
	};

	const handleCreateCollection = () => {
		if (!newCollectionName.trim()) return;

		const newCollection = collectionService.createCollection(newCollectionName.trim(), newCollectionDescription.trim() || undefined);

		setCollections(prev => [...prev, newCollection]);
		setNewCollectionName('');
		setNewCollectionDescription('');
		setShowCreateForm(false);

		// Update metadata
		const meta = collectionService.getCollectionMetadata(newCollection.id);
		if (meta) {
			setMetadata(prev => new Map(prev.set(newCollection.id, meta)));
		}

		// Auto-select the new collection
		if (onCollectionSelect) {
			onCollectionSelect(newCollection);
		}
	};

	const handleEditCollection = (collectionId: string) => {
		if (!newCollectionName.trim()) return;

		const updatedCollection = collectionService.updateCollection(collectionId, {
			name: newCollectionName.trim(),
			description: newCollectionDescription.trim() || undefined,
		});

		if (updatedCollection) {
			setCollections(prev => prev.map(c => (c.id === collectionId ? updatedCollection : c)));

			// Update metadata
			const meta = collectionService.getCollectionMetadata(updatedCollection.id);
			if (meta) {
				setMetadata(prev => new Map(prev.set(updatedCollection.id, meta)));
			}
		}

		setEditingId(null);
		setNewCollectionName('');
		setNewCollectionDescription('');
	};

	const handleDeleteCollection = (collection: Collection) => {
		if (window.confirm(`Are you sure you want to delete "${collection.name}"? This action cannot be undone.`)) {
			const success = collectionService.deleteCollection(collection.id);
			if (success) {
				setCollections(prev => prev.filter(c => c.id !== collection.id));
				setMetadata(prev => {
					const newMap = new Map(prev);
					newMap.delete(collection.id);
					return newMap;
				});

				// Clear selection if deleted collection was selected
				if (selectedCollectionId === collection.id && onCollectionSelect) {
					const remainingCollections = collections.filter(c => c.id !== collection.id);
					onCollectionSelect(remainingCollections[0] || null);
				}
			}
		}
	};

	const startEdit = (collection: Collection) => {
		setEditingId(collection.id);
		setNewCollectionName(collection.name);
		setNewCollectionDescription(collection.description || '');
	};

	const cancelEdit = () => {
		setEditingId(null);
		setNewCollectionName('');
		setNewCollectionDescription('');
	};

	const cancelCreate = () => {
		setShowCreateForm(false);
		setNewCollectionName('');
		setNewCollectionDescription('');
	};

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(date);
	};

	return (
		<Card className='h-full'>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
				<CardTitle className='text-lg font-semibold'>Collections</CardTitle>
				<Button size='sm' className='gap-2' onClick={() => setShowCreateForm(true)} disabled={showCreateForm}>
					<Plus className='h-4 w-4' />
					New Collection
				</Button>
			</CardHeader>

			<CardContent className='space-y-4'>
				{/* Create Collection Form */}
				{showCreateForm && (
					<Card className='border-2 border-dashed border-primary/50'>
						<CardContent className='p-4 space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='new-collection-name'>Collection Name</Label>
								<Input
									id='new-collection-name'
									placeholder='My API Collection'
									value={newCollectionName}
									onChange={e => setNewCollectionName(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='new-collection-description'>Description (Optional)</Label>
								<Textarea
									id='new-collection-description'
									placeholder='A brief description of this collection...'
									value={newCollectionDescription}
									onChange={e => setNewCollectionDescription(e.target.value)}
									rows={2}
								/>
							</div>
							<div className='flex gap-2'>
								<Button size='sm' onClick={handleCreateCollection} disabled={!newCollectionName.trim()} className='gap-2'>
									<Save className='h-4 w-4' />
									Create
								</Button>
								<Button variant='outline' size='sm' onClick={cancelCreate} className='gap-2'>
									<X className='h-4 w-4' />
									Cancel
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Collections List */}
				{collections.length === 0 ? (
					<div className='text-center py-8 text-muted-foreground'>
						<FolderOpen className='h-12 w-12 mx-auto mb-4 opacity-50' />
						<p className='text-sm'>No collections yet</p>
						<p className='text-xs'>Create your first collection to get started</p>
					</div>
				) : (
					collections.map(collection => {
						const meta = metadata.get(collection.id);
						const isSelected = selectedCollectionId === collection.id;
						const isEditing = editingId === collection.id;

						return (
							<Card
								key={collection.id}
								className={`transition-colors ${isSelected ? 'border-primary bg-accent/30' : 'hover:bg-accent/50 cursor-pointer'}`}
								onClick={() => !isEditing && onCollectionSelect?.(collection)}>
								<CardContent className='p-4'>
									{isEditing ? (
										// Edit Form
										<div className='space-y-4'>
											<div className='space-y-2'>
												<Label>Collection Name</Label>
												<Input
													value={newCollectionName}
													onChange={e => setNewCollectionName(e.target.value)}
													onKeyDown={e => e.key === 'Enter' && handleEditCollection(collection.id)}
												/>
											</div>
											<div className='space-y-2'>
												<Label>Description (Optional)</Label>
												<Textarea value={newCollectionDescription} onChange={e => setNewCollectionDescription(e.target.value)} rows={2} />
											</div>
											<div className='flex gap-2'>
												<Button size='sm' onClick={() => handleEditCollection(collection.id)} disabled={!newCollectionName.trim()} className='gap-2'>
													<Save className='h-4 w-4' />
													Save
												</Button>
												<Button variant='outline' size='sm' onClick={cancelEdit} className='gap-2'>
													<X className='h-4 w-4' />
													Cancel
												</Button>
											</div>
										</div>
									) : (
										// Display Mode
										<div className='flex items-start justify-between'>
											<div className='flex-1 min-w-0'>
												<div className='flex items-center gap-2 mb-2'>
													<h3 className='font-medium truncate'>{collection.name}</h3>
													{isSelected && (
														<Badge variant='secondary' className='text-xs'>
															Selected
														</Badge>
													)}
												</div>

												{collection.description && <p className='text-sm text-muted-foreground mb-3 line-clamp-2'>{collection.description}</p>}

												<div className='flex flex-wrap gap-4 text-xs text-muted-foreground'>
													{meta && (
														<>
															<div className='flex items-center gap-1'>
																<FileText className='h-3 w-3' />
																{meta.requestCount} request{meta.requestCount !== 1 ? 's' : ''}
															</div>
															<div className='flex items-center gap-1'>
																<FolderOpen className='h-3 w-3' />
																{meta.folderCount} folder{meta.folderCount !== 1 ? 's' : ''}
															</div>
															<div className='flex items-center gap-1'>
																<Calendar className='h-3 w-3' />
																{formatDate(meta.updatedAt)}
															</div>
														</>
													)}
												</div>
											</div>

											<div className='flex gap-1 ml-4'>
												<Button
													variant='ghost'
													size='sm'
													className='h-8 w-8 p-0'
													onClick={e => {
														e.stopPropagation();
														startEdit(collection);
													}}>
													<Edit className='h-4 w-4' />
												</Button>
												<Button
													variant='ghost'
													size='sm'
													className='h-8 w-8 p-0 text-destructive hover:text-destructive'
													onClick={e => {
														e.stopPropagation();
														handleDeleteCollection(collection);
													}}>
													<Trash2 className='h-4 w-4' />
												</Button>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						);
					})
				)}
			</CardContent>
		</Card>
	);
};

export default CollectionManager;
