import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Edit, Trash2, FolderOpen, FileText, Calendar, Save, X } from 'lucide-react';
import { Collection, CollectionMetadata } from '@/types/collection';
import { collectionService } from '@/services/collection-service';

interface CollectionManagerProps {
	onCollectionSelect?: (collection: Collection) => void;
	selectedCollectionId?: string;
}

export const CollectionManager: React.FC<CollectionManagerProps> = ({ onCollectionSelect, selectedCollectionId }) => {
	const [collections, setCollections] = useState<Collection[]>([]);
	const [metadata, setMetadata] = useState<Map<string, CollectionMetadata>>(new Map());
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
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
		setIsCreateDialogOpen(false);

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

	const handleEditCollection = () => {
		if (!editingCollection || !newCollectionName.trim()) return;

		const updatedCollection = collectionService.updateCollection(editingCollection.id, {
			name: newCollectionName.trim(),
			description: newCollectionDescription.trim() || undefined,
		});

		if (updatedCollection) {
			setCollections(prev => prev.map(c => (c.id === editingCollection.id ? updatedCollection : c)));

			// Update metadata
			const meta = collectionService.getCollectionMetadata(updatedCollection.id);
			if (meta) {
				setMetadata(prev => new Map(prev.set(updatedCollection.id, meta)));
			}
		}

		setEditingCollection(null);
		setNewCollectionName('');
		setNewCollectionDescription('');
		setIsEditDialogOpen(false);
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

	const openEditDialog = (collection: Collection) => {
		setEditingCollection(collection);
		setNewCollectionName(collection.name);
		setNewCollectionDescription(collection.description || '');
		setIsEditDialogOpen(true);
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
		<Card className='h-full border-border bg-card text-card-foreground'>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
				<CardTitle className='text-lg font-semibold text-foreground'>Collections</CardTitle>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button size='sm' className='gap-2 bg-primary text-primary-foreground hover:bg-primary/90'>
							<Plus className='h-4 w-4' />
							New Collection
						</Button>
					</DialogTrigger>
					<DialogContent className='bg-popover text-popover-foreground border-border'>
						<DialogHeader>
							<DialogTitle className='text-foreground'>Create New Collection</DialogTitle>
							<DialogDescription className='text-muted-foreground'>Create a new collection to organize your API requests.</DialogDescription>
						</DialogHeader>
						<div className='space-y-4 py-4'>
							<div className='space-y-2'>
								<Label htmlFor='collection-name' className='text-foreground'>
									Name
								</Label>
								<Input
									id='collection-name'
									placeholder='My API Collection'
									value={newCollectionName}
									onChange={e => setNewCollectionName(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
									className='bg-input border-border text-foreground placeholder:text-muted-foreground'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='collection-description' className='text-foreground'>
									Description (Optional)
								</Label>
								<Textarea
									id='collection-description'
									placeholder='A brief description of this collection...'
									value={newCollectionDescription}
									onChange={e => setNewCollectionDescription(e.target.value)}
									rows={3}
									className='bg-input border-border text-foreground placeholder:text-muted-foreground resize-none'
								/>
							</div>
						</div>
						<div className='flex justify-end gap-2'>
							<Button
								variant='outline'
								onClick={() => setIsCreateDialogOpen(false)}
								className='border-border text-foreground hover:bg-accent hover:text-accent-foreground'>
								Cancel
							</Button>
							<Button
								onClick={handleCreateCollection}
								disabled={!newCollectionName.trim()}
								className='bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'>
								Create Collection
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</CardHeader>

			<CardContent className='space-y-3 overflow-hidden'>
				{collections.length === 0 ? (
					<div className='text-center py-8 text-muted-foreground'>
						<FolderOpen className='h-12 w-12 mx-auto mb-4 opacity-50' />
						<p className='text-sm'>No collections yet</p>
						<p className='text-xs opacity-70'>Create your first collection to get started</p>
					</div>
				) : (
					<div className='space-y-3 max-h-[60vh] overflow-y-auto force-scrollbar-visible pr-1'>
						{collections.map(collection => {
							const meta = metadata.get(collection.id);
							const isSelected = selectedCollectionId === collection.id;

							return (
								<Card
									key={collection.id}
									className={`cursor-pointer transition-all duration-200 hover:shadow-sm group ${
										isSelected ? 'border-primary bg-accent/50 shadow-sm' : 'border-border hover:border-primary/50 hover:bg-accent/30'
									}`}
									onClick={() => onCollectionSelect?.(collection)}>
									<CardContent className='p-4'>
										<div className='flex items-start justify-between'>
											<div className='flex-1 min-w-0'>
												<div className='flex items-center gap-2 mb-2'>
													<h3 className='font-medium truncate text-foreground'>{collection.name}</h3>
													{isSelected && (
														<Badge variant='secondary' className='text-xs bg-primary/20 text-primary'>
															Selected
														</Badge>
													)}
												</div>

												{collection.description && <p className='text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed'>{collection.description}</p>}

												<div className='flex flex-wrap gap-4 text-xs text-muted-foreground'>
													{meta && (
														<>
															<div className='flex items-center gap-1'>
																<FileText className='h-3 w-3' />
																<span>
																	{meta.requestCount} request{meta.requestCount !== 1 ? 's' : ''}
																</span>
															</div>
															<div className='flex items-center gap-1'>
																<FolderOpen className='h-3 w-3' />
																<span>
																	{meta.folderCount} folder{meta.folderCount !== 1 ? 's' : ''}
																</span>
															</div>
															<div className='flex items-center gap-1'>
																<Calendar className='h-3 w-3' />
																<span>{formatDate(meta.updatedAt)}</span>
															</div>
														</>
													)}
												</div>
											</div>

											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant='ghost'
														size='sm'
														className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-foreground'
														onClick={e => e.stopPropagation()}>
														<MoreHorizontal className='h-4 w-4' />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end' className='bg-popover text-popover-foreground border-border shadow-md'>
													<DropdownMenuItem
														onClick={e => {
															e.stopPropagation();
															openEditDialog(collection);
														}}
														className='cursor-pointer hover:bg-accent hover:text-accent-foreground'>
														<Edit className='h-4 w-4 mr-2' />
														Edit Collection
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={e => {
															e.stopPropagation();
															handleDeleteCollection(collection);
														}}
														className='cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive'>
														<Trash2 className='h-4 w-4 mr-2' />
														Delete Collection
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</CardContent>

			{/* Edit Collection Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className='bg-popover text-popover-foreground border-border'>
					<DialogHeader>
						<DialogTitle className='text-foreground'>Edit Collection</DialogTitle>
						<DialogDescription className='text-muted-foreground'>Update the collection name and description.</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<Label htmlFor='edit-collection-name' className='text-foreground'>
								Name
							</Label>
							<Input
								id='edit-collection-name'
								value={newCollectionName}
								onChange={e => setNewCollectionName(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && handleEditCollection()}
								className='bg-input border-border text-foreground'
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='edit-collection-description' className='text-foreground'>
								Description (Optional)
							</Label>
							<Textarea
								id='edit-collection-description'
								value={newCollectionDescription}
								onChange={e => setNewCollectionDescription(e.target.value)}
								rows={3}
								className='bg-input border-border text-foreground resize-none'
							/>
						</div>
					</div>
					<div className='flex justify-end gap-2'>
						<Button
							variant='outline'
							onClick={() => setIsEditDialogOpen(false)}
							className='border-border text-foreground hover:bg-accent hover:text-accent-foreground'>
							Cancel
						</Button>
						<Button
							onClick={handleEditCollection}
							disabled={!newCollectionName.trim()}
							className='bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'>
							Save Changes
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</Card>
	);
};

export default CollectionManager;
