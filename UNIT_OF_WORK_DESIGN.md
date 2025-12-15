# Unit of Work Pattern - Design Document

## ⚠️ CRITICAL: This is a pseudo-code design document only. Do NOT implement without user approval.

## Problem Statement

**User Quote:** "you said UOW pattern should be introduced. But I didn't find anything related to it"

Currently, the domain layer (collectionService, historyService) knows too much about persistence timing:

```typescript
// ❌ Current pattern - Domain service manages persistence explicitly
async createCollection(name: string, description?: string): Promise<void> {
    const collection = { id: uuid(), name, description, ... };
    this.collections.set(collection.id, collection);

    // Domain service knows WHEN to persist
    if (this.persistence) {
        await this.persistence.createCollection(collection);
    }
}
```

**Issues:**

1. Domain service tightly coupled to persistence timing
2. No transaction boundaries for multi-entity operations
3. Difficult to batch operations (performance issue)
4. Cannot easily rollback failed multi-step operations
5. Domain logic mixed with persistence coordination

---

## Solution: Unit of Work Pattern

**Core Concept:** Track entity changes in memory, then persist all changes atomically in a single `commit()` operation.

```typescript
// ✅ With UoW - Domain service only tracks state changes
createCollection(name: string, description?: string): void {
    const collection = { id: uuid(), name, description, ... };
    this.collections.set(collection.id, collection);

    // UoW tracks this entity as "new"
    this.uow.registerNew(collection, 'collection');
}

// Somewhere in handler/command:
async handleCreateCollection(message, panel) {
    collectionService.createCollection(message.name, message.description);

    // Single commit persists ALL tracked changes
    await uow.commit();

    StateManager.saveState(); // Optional, can be inside UoW
}
```

---

## Architecture Design

### Location in Codebase

**Option 1: Domain Layer** (Recommended)

- Path: `src/domain/services/unit-of-work.ts`
- Pro: Pure business logic, no VSCode dependencies
- Pro: Can be tested independently
- Pro: Follows Clean Architecture principles

**Option 2: Shared Layer**

- Path: `src/shared/services/unit-of-work.ts`
- Pro: Can be used by both extension and domain
- Con: Introduces coupling between layers

**Recommendation:** Place in `src/domain/services/` alongside other domain services.

---

## Interface Design (Pseudo-code)

```typescript
// src/domain/services/unit-of-work.ts

/**
 * Entity tracking for Unit of Work pattern
 */
interface TrackedEntity {
	entity: any; // The domain entity (Collection, HistoryItem, etc.)
	type: EntityType; // 'collection' | 'folder' | 'request' | 'history' | 'environment'
	state: EntityState; // 'new' | 'modified' | 'removed'
	originalData?: any; // For rollback (clone of original state)
}

type EntityType = 'collection' | 'folder' | 'request' | 'history' | 'environment';
type EntityState = 'new' | 'modified' | 'removed';

/**
 * Unit of Work - Coordinates persistence of multiple entity changes
 */
export class UnitOfWork {
	private newEntities: Map<string, TrackedEntity> = new Map();
	private modifiedEntities: Map<string, TrackedEntity> = new Map();
	private removedEntities: Map<string, TrackedEntity> = new Map();

	// Persistence adapters (injected)
	private collectionPersistence: ICollectionPersistence | null = null;
	private historyPersistence: IHistoryPersistence | null = null;
	// ... other persistence adapters

	constructor() {}

	/**
	 * Inject persistence adapters (called during initialization)
	 */
	setPersistence(adapters: {
		collection?: ICollectionPersistence;
		history?: IHistoryPersistence;
		// ... other adapters
	}): void {
		this.collectionPersistence = adapters.collection || null;
		this.historyPersistence = adapters.history || null;
	}

	/**
	 * Register a new entity to be created
	 */
	registerNew(entity: any, type: EntityType): void {
		const id = this.getEntityId(entity, type);

		// Remove from modified/removed if previously tracked
		this.modifiedEntities.delete(id);
		this.removedEntities.delete(id);

		// Add to new entities
		this.newEntities.set(id, {
			entity,
			type,
			state: 'new',
		});
	}

	/**
	 * Register an entity as modified
	 */
	registerModified(entity: any, type: EntityType, originalData?: any): void {
		const id = this.getEntityId(entity, type);

		// Skip if already marked as new (will be inserted anyway)
		if (this.newEntities.has(id)) {
			return;
		}

		// Skip if already marked as removed
		if (this.removedEntities.has(id)) {
			return;
		}

		// Add to modified entities
		this.modifiedEntities.set(id, {
			entity,
			type,
			state: 'modified',
			originalData: originalData || null,
		});
	}

	/**
	 * Register an entity to be deleted
	 */
	registerRemoved(entity: any, type: EntityType): void {
		const id = this.getEntityId(entity, type);

		// If entity was marked as new, just remove from tracking
		if (this.newEntities.has(id)) {
			this.newEntities.delete(id);
			return;
		}

		// Remove from modified
		this.modifiedEntities.delete(id);

		// Add to removed entities
		this.removedEntities.set(id, {
			entity,
			type,
			state: 'removed',
		});
	}

	/**
	 * Commit all tracked changes to persistence layer
	 * Uses database transaction for atomicity
	 */
	async commit(): Promise<void> {
		// No changes to persist
		if (this.newEntities.size === 0 && this.modifiedEntities.size === 0 && this.removedEntities.size === 0) {
			return;
		}

		// TODO: Wrap in DatabaseTransaction for atomicity
		// const transaction = new DatabaseTransaction(getDatabase());

		try {
			// await transaction.begin();

			// 1. Process NEW entities (inserts)
			for (const [id, tracked] of this.newEntities) {
				await this.persistNew(tracked);
			}

			// 2. Process MODIFIED entities (updates)
			for (const [id, tracked] of this.modifiedEntities) {
				await this.persistModified(tracked);
			}

			// 3. Process REMOVED entities (deletes)
			for (const [id, tracked] of this.removedEntities) {
				await this.persistRemoved(tracked);
			}

			// await transaction.commit();

			// Clear tracking after successful commit
			this.clear();
		} catch (error) {
			// await transaction.rollback();
			throw new PersistenceError('Unit of Work commit failed', error);
		}
	}

	/**
	 * Rollback all in-memory changes (restore original data)
	 * NOTE: Does NOT rollback database - use DatabaseTransaction for that
	 */
	rollback(): void {
		// Restore modified entities to original state
		for (const [id, tracked] of this.modifiedEntities) {
			if (tracked.originalData) {
				Object.assign(tracked.entity, tracked.originalData);
			}
		}

		this.clear();
	}

	/**
	 * Clear all tracked entities
	 */
	clear(): void {
		this.newEntities.clear();
		this.modifiedEntities.clear();
		this.removedEntities.clear();
	}

	/**
	 * Check if there are pending changes
	 */
	hasPendingChanges(): boolean {
		return this.newEntities.size > 0 || this.modifiedEntities.size > 0 || this.removedEntities.size > 0;
	}

	/**
	 * Get count of pending changes
	 */
	getPendingChangesCount(): { new: number; modified: number; removed: number } {
		return {
			new: this.newEntities.size,
			modified: this.modifiedEntities.size,
			removed: this.removedEntities.size,
		};
	}

	// ================== PRIVATE HELPERS ==================

	private getEntityId(entity: any, type: EntityType): string {
		switch (type) {
			case 'collection':
				return entity.id || entity.collectionId;
			case 'folder':
				return entity.id || entity.folderId;
			case 'request':
				return entity.id || entity.requestId;
			case 'history':
				return entity.historyId;
			case 'environment':
				return entity.id || entity.environmentId;
			default:
				throw new Error(`Unknown entity type: ${type}`);
		}
	}

	private async persistNew(tracked: TrackedEntity): Promise<void> {
		switch (tracked.type) {
			case 'collection':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.createCollection(tracked.entity);
				break;

			case 'folder':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.createFolder(tracked.entity);
				break;

			case 'request':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.createRequest(tracked.entity);
				break;

			case 'history':
				if (!this.historyPersistence) {
					throw new Error('History persistence not configured');
				}
				await this.historyPersistence.create(tracked.entity);
				break;

			// ... other types

			default:
				throw new Error(`Cannot persist new entity of type: ${tracked.type}`);
		}
	}

	private async persistModified(tracked: TrackedEntity): Promise<void> {
		switch (tracked.type) {
			case 'collection':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.updateCollection(tracked.entity);
				break;

			case 'folder':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.updateFolder(tracked.entity);
				break;

			case 'request':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.updateRequest(tracked.entity);
				break;

			// History items are typically not modified (immutable)

			default:
				throw new Error(`Cannot persist modified entity of type: ${tracked.type}`);
		}
	}

	private async persistRemoved(tracked: TrackedEntity): Promise<void> {
		const id = this.getEntityId(tracked.entity, tracked.type);

		switch (tracked.type) {
			case 'collection':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.deleteCollection(id);
				break;

			case 'folder':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.deleteFolder(id);
				break;

			case 'request':
				if (!this.collectionPersistence) {
					throw new Error('Collection persistence not configured');
				}
				await this.collectionPersistence.deleteRequest(id);
				break;

			case 'history':
				if (!this.historyPersistence) {
					throw new Error('History persistence not configured');
				}
				await this.historyPersistence.delete(id);
				break;

			default:
				throw new Error(`Cannot persist removed entity of type: ${tracked.type}`);
		}
	}
}

// Singleton instance
export const unitOfWork = new UnitOfWork();
```

---

## Domain Service Integration (Pseudo-code)

### Collection Service Example

```typescript
// src/domain/services/collectionService.ts

import { unitOfWork } from './unit-of-work';

export class CollectionService {
	// Remove direct persistence calls from domain methods

	createCollection(name: string, description?: string): Collection {
		const collection: Collection = {
			id: uuid(),
			name,
			description: description || '',
			// ... other properties
		};

		this.collections.set(collection.id, collection);

		// ✅ Register with UoW instead of direct persistence
		unitOfWork.registerNew(collection, 'collection');

		return collection;
	}

	updateCollection(collectionId: string, updates: Partial<Collection>): void {
		const collection = this.collections.get(collectionId);
		if (!collection) {
			throw new Error(`Collection ${collectionId} not found`);
		}

		// Clone original for rollback
		const original = { ...collection };

		// Apply updates
		Object.assign(collection, updates);

		// ✅ Register with UoW
		unitOfWork.registerModified(collection, 'collection', original);
	}

	deleteCollection(collectionId: string): void {
		const collection = this.collections.get(collectionId);
		if (!collection) {
			throw new Error(`Collection ${collectionId} not found`);
		}

		this.collections.delete(collectionId);

		// ✅ Register with UoW
		unitOfWork.registerRemoved(collection, 'collection');
	}

	// ... other methods follow same pattern
}
```

### History Service Example

```typescript
// src/domain/services/history-service.ts

import { unitOfWork } from './unit-of-work';

export class HistoryService {
	addToHistory(request: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
		const historyItem: HistoryItem = {
			historyId: this.generateId(),
			timestamp: new Date(),
			...request,
		};

		this.history.set(historyItem.historyId, historyItem);

		// ✅ Register with UoW
		unitOfWork.registerNew(historyItem, 'history');

		return historyItem;
	}

	deleteHistoryItem(historyId: string): void {
		const item = this.history.get(historyId);
		if (!item) return;

		this.history.delete(historyId);

		// ✅ Register with UoW
		unitOfWork.registerRemoved(item, 'history');
	}

	clearHistory(): void {
		const items = Array.from(this.history.values());
		this.history.clear();

		// ✅ Register all items as removed
		items.forEach(item => {
			unitOfWork.registerRemoved(item, 'history');
		});
	}
}
```

---

## Handler Integration (Pseudo-code)

```typescript
// src/extension/handlers/collection-handler.ts

import { unitOfWork } from '@/domain/services/unit-of-work';

export class CollectionHandler {
	async handleCreateCollection(message: any, panel: WebviewPanel): Promise<void> {
		try {
			// Domain operation (no await needed - synchronous)
			const collection = collectionService.createCollection(message.name, message.description);

			// ✅ Commit all pending changes in one transaction
			await unitOfWork.commit();

			// StateManager.saveState() might be inside UoW or separate
			StateManager.saveState();

			// Notify webview
			panel.webview.postMessage({
				command: 'collectionCreated',
				collection,
			});
		} catch (error) {
			console.error('[CollectionHandler] Failed to create collection:', error);

			// ✅ Rollback in-memory changes
			unitOfWork.rollback();

			panel.webview.postMessage({
				command: 'error',
				message: `Failed to create collection: ${error.message}`,
			});

			throw error;
		}
	}

	async handleDeleteCollection(message: any, panel: WebviewPanel): Promise<void> {
		try {
			// Domain operation
			collectionService.deleteCollection(message.collectionId);

			// ✅ Commit
			await unitOfWork.commit();

			StateManager.saveState();

			panel.webview.postMessage({
				command: 'collectionDeleted',
				collectionId: message.collectionId,
			});
		} catch (error) {
			console.error('[CollectionHandler] Failed to delete collection:', error);

			// ✅ Rollback
			unitOfWork.rollback();

			panel.webview.postMessage({
				command: 'error',
				message: `Failed to delete collection: ${error.message}`,
			});

			throw error;
		}
	}
}
```

---

## Benefits of Unit of Work Pattern

### 1. **Separation of Concerns**

```typescript
// ❌ Before: Domain service knows about persistence timing
async createCollection(name: string) {
    const collection = { id: uuid(), name };
    this.collections.set(collection.id, collection);

    // Domain service manages persistence ❌
    if (this.persistence) {
        await this.persistence.createCollection(collection);
    }
}

// ✅ After: Domain service only knows business logic
createCollection(name: string) {
    const collection = { id: uuid(), name };
    this.collections.set(collection.id, collection);

    // UoW handles persistence ✅
    unitOfWork.registerNew(collection, 'collection');
}
```

### 2. **Atomic Multi-Entity Operations**

```typescript
// ❌ Before: Multiple persistence calls, no atomicity
async moveRequestToFolder(requestId: string, folderId: string) {
    const request = this.requests.get(requestId);
    const oldFolderId = request.folderId;

    request.folderId = folderId;
    await this.persistence.updateRequest(request);  // ❌ Can fail

    const folder = this.folders.get(folderId);
    folder.requestCount++;
    await this.persistence.updateFolder(folder);     // ❌ Can fail independently
}

// ✅ After: All changes committed atomically
moveRequestToFolder(requestId: string, folderId: string) {
    const request = this.requests.get(requestId);
    request.folderId = folderId;
    unitOfWork.registerModified(request, 'request');

    const folder = this.folders.get(folderId);
    folder.requestCount++;
    unitOfWork.registerModified(folder, 'folder');

    // Handler calls: await unitOfWork.commit();
    // Both updates succeed or both rollback ✅
}
```

### 3. **Performance - Batch Operations**

```typescript
// ❌ Before: N database calls for N items
async deleteMultipleRequests(requestIds: string[]) {
    for (const id of requestIds) {
        this.requests.delete(id);
        await this.persistence.deleteRequest(id);  // ❌ N database roundtrips
    }
}

// ✅ After: Single transaction for N items
deleteMultipleRequests(requestIds: string[]) {
    for (const id of requestIds) {
        const request = this.requests.get(id);
        this.requests.delete(id);
        unitOfWork.registerRemoved(request, 'request');
    }

    // Handler calls: await unitOfWork.commit();
    // All deletes in one transaction ✅
}
```

### 4. **Rollback Support**

```typescript
// ❌ Before: Cannot rollback in-memory changes if persistence fails
async updateCollection(id: string, updates: Partial<Collection>) {
    const collection = this.collections.get(id);
    Object.assign(collection, updates);  // ❌ In-memory changed

    try {
        await this.persistence.updateCollection(collection);
    } catch (error) {
        // ❌ Too late - in-memory state already corrupted
        throw error;
    }
}

// ✅ After: Can rollback both in-memory and database changes
updateCollection(id: string, updates: Partial<Collection>) {
    const collection = this.collections.get(id);
    const original = { ...collection };  // Clone original

    Object.assign(collection, updates);
    unitOfWork.registerModified(collection, 'collection', original);

    // Handler calls:
    // try { await unitOfWork.commit(); }
    // catch { unitOfWork.rollback(); }  ✅ Restores original
}
```

### 5. **Testability**

```typescript
// ❌ Before: Must mock persistence in every test
test('createCollection adds to in-memory map', async () => {
	const mockPersistence = { createCollection: jest.fn() };
	service.setPersistence(mockPersistence);

	await service.createCollection('Test'); // Must await
	expect(mockPersistence.createCollection).toHaveBeenCalled();
});

// ✅ After: Test domain logic without persistence
test('createCollection registers with UoW', () => {
	const collection = service.createCollection('Test'); // Sync!

	expect(unitOfWork.hasPendingChanges()).toBe(true);
	expect(unitOfWork.getPendingChangesCount().new).toBe(1);
});
```

---

## Implementation Phases

### Phase 1: Create UnitOfWork Infrastructure

1. Create `src/domain/services/unit-of-work.ts`
2. Implement TrackedEntity interface
3. Implement UnitOfWork class with register methods
4. Add persistence injection via `setPersistence()`

### Phase 2: Integrate with Persistence Layer

1. Update `persistNew()`, `persistModified()`, `persistRemoved()` methods
2. Add DatabaseTransaction integration for atomicity
3. Add comprehensive error handling

### Phase 3: Update Domain Services

1. Remove `async` from domain methods (make synchronous)
2. Replace direct persistence calls with `unitOfWork.register*()` calls
3. Update collectionService methods
4. Update historyService methods

### Phase 4: Update Handlers

1. Add `await unitOfWork.commit()` after domain operations
2. Add `unitOfWork.rollback()` in catch blocks
3. Update collection-handler.ts
4. Update history-handler.ts
5. Update request-handler.ts

### Phase 5: Update Commands

1. Add `await unitOfWork.commit()` after domain operations
2. Add rollback in error handlers
3. Update collection-commands.ts
4. Update history-commands.ts

### Phase 6: Update StateManager

1. Configure UoW persistence adapters in `initialize()`
2. Add `await unitOfWork.commit()` where needed
3. Handle pending changes on shutdown

---

## Testing Strategy

### Unit Tests

```typescript
describe('UnitOfWork', () => {
	it('should track new entities', () => {
		const uow = new UnitOfWork();
		const collection = { id: '1', name: 'Test' };

		uow.registerNew(collection, 'collection');

		expect(uow.hasPendingChanges()).toBe(true);
		expect(uow.getPendingChangesCount().new).toBe(1);
	});

	it('should commit new entities to persistence', async () => {
		const mockPersistence = {
			createCollection: jest.fn().mockResolvedValue(undefined),
		};

		const uow = new UnitOfWork();
		uow.setPersistence({ collection: mockPersistence });

		const collection = { id: '1', name: 'Test' };
		uow.registerNew(collection, 'collection');

		await uow.commit();

		expect(mockPersistence.createCollection).toHaveBeenCalledWith(collection);
		expect(uow.hasPendingChanges()).toBe(false);
	});

	it('should rollback in-memory changes on error', async () => {
		const uow = new UnitOfWork();

		const original = { id: '1', name: 'Original' };
		const entity = { ...original };
		entity.name = 'Modified';

		uow.registerModified(entity, 'collection', original);
		uow.rollback();

		expect(entity.name).toBe('Original');
	});
});
```

### Integration Tests

```typescript
describe('CollectionService with UnitOfWork', () => {
	it('should create collection and persist atomically', async () => {
		const collection = collectionService.createCollection('Test');

		expect(unitOfWork.hasPendingChanges()).toBe(true);

		await unitOfWork.commit();

		// Verify database
		const persisted = await collectionPersistence.loadById(collection.id);
		expect(persisted).toEqual(collection);
	});
});
```

---

## Migration Checklist

- [ ] Create `unit-of-work.ts` with complete implementation
- [ ] Add `unitOfWork.setPersistence()` call in StateManager
- [ ] Remove `async` from collectionService domain methods
- [ ] Replace persistence calls with `unitOfWork.register*()` in collectionService
- [ ] Remove `async` from historyService domain methods (where applicable)
- [ ] Replace persistence calls with `unitOfWork.register*()` in historyService
- [ ] Add `await unitOfWork.commit()` in all handlers
- [ ] Add `unitOfWork.rollback()` in all error handlers
- [ ] Add `await unitOfWork.commit()` in all commands
- [ ] Update StateManager to handle UoW lifecycle
- [ ] Write unit tests for UnitOfWork
- [ ] Write integration tests for domain services with UoW
- [ ] Update architecture documentation

---

## Questions for User

1. **Scope:** Should UoW be implemented for all entities (collections, history, environments) or start with collections only?

2. **Transaction Boundaries:** Should every handler call automatically commit, or should we allow batching across multiple operations?

3. **StateManager Integration:** Should `StateManager.saveState()` be called inside `unitOfWork.commit()` or remain separate?

4. **Synchronous vs Async:** Should domain methods become synchronous (current proposal) or remain async?

5. **Rollback Strategy:** Should `rollback()` only affect in-memory state, or also issue database rollback commands?

6. **Performance:** Should we add a "dirty checking" mechanism to only persist truly modified entities?

---

## Conclusion

**Status:** This feature was promised during architectural analysis but never implemented.

**Impact:** High - Affects core domain service architecture, persistence coordination, and transaction boundaries.

**Recommendation:** Implement in phases, starting with CollectionService integration, then expand to HistoryService.

**User Decision Required:** Approval to proceed with implementation following this design.
