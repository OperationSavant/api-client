// import { historyService } from '@/services/history-service';
// import { RequestHistory, HistoryFilter, HistorySort } from '@/shared/types/history';

// describe('HistoryService', () => {
// 	beforeEach(() => {
// 		// Clear localStorage before each test
// 		localStorage.clear();
// 		// Reset the service state
// 		historyService.clearHistory();
// 	});

// 	describe('Basic CRUD Operations', () => {
// 		test('should add request to history', () => {
// 			const request = {
// 				url: 'https://api.example.com/users',
// 				method: 'GET' as const,
// 				status: 200,
// 				statusText: 'OK',
// 				responseTime: 150,
// 				success: true,
// 			};

// 			const historyItem = historyService.addToHistory(request);

// 			expect(historyItem).toBeDefined();
// 			expect(historyItem.id).toBeDefined();
// 			expect(historyItem.timestamp).toBeInstanceOf(Date);
// 			expect(historyItem.url).toBe(request.url);
// 			expect(historyItem.method).toBe(request.method);
// 			expect(historyItem.status).toBe(request.status);
// 			expect(historyItem.success).toBe(true);
// 		});

// 		test('should retrieve history items', () => {
// 			const request1 = {
// 				url: 'https://api.example.com/users',
// 				method: 'GET' as const,
// 				success: true,
// 			};
// 			const request2 = {
// 				url: 'https://api.example.com/posts',
// 				method: 'POST' as const,
// 				success: true,
// 			};

// 			historyService.addToHistory(request1);
// 			historyService.addToHistory(request2);

// 			const history = historyService.getHistory();
// 			expect(history).toHaveLength(2);
// 			expect(history[0].url).toBe(request2.url); // Latest first
// 			expect(history[1].url).toBe(request1.url);
// 		});

// 		test('should get specific history item by id', () => {
// 			const request = {
// 				url: 'https://api.example.com/users',
// 				method: 'GET' as const,
// 				success: true,
// 			};

// 			const added = historyService.addToHistory(request);
// 			const retrieved = historyService.getHistoryItem(added.id);

// 			expect(retrieved).toBeDefined();
// 			expect(retrieved!.id).toBe(added.id);
// 			expect(retrieved!.url).toBe(request.url);
// 		});

// 		test('should return undefined for non-existent history item', () => {
// 			const retrieved = historyService.getHistoryItem('non-existent-id');
// 			expect(retrieved).toBeUndefined();
// 		});

// 		test('should delete history item', () => {
// 			const request = {
// 				url: 'https://api.example.com/users',
// 				method: 'GET' as const,
// 				success: true,
// 			};

// 			const added = historyService.addToHistory(request);
// 			const deleted = historyService.deleteHistoryItem(added.id);
// 			const retrieved = historyService.getHistoryItem(added.id);

// 			expect(deleted).toBe(true);
// 			expect(retrieved).toBeUndefined();
// 		});

// 		test('should return false when deleting non-existent item', () => {
// 			const deleted = historyService.deleteHistoryItem('non-existent-id');
// 			expect(deleted).toBe(false);
// 		});

// 		test('should delete multiple items', () => {
// 			const request1 = {
// 				url: 'https://api.example.com/users',
// 				method: 'GET' as const,
// 				success: true,
// 			};
// 			const request2 = {
// 				url: 'https://api.example.com/posts',
// 				method: 'POST' as const,
// 				success: true,
// 			};

// 			const added1 = historyService.addToHistory(request1);
// 			const added2 = historyService.addToHistory(request2);

// 			const deletedCount = historyService.deleteMultipleItems([added1.id, added2.id]);
// 			const history = historyService.getHistory();

// 			expect(deletedCount).toBe(2);
// 			expect(history).toHaveLength(0);
// 		});

// 		test('should clear all history', () => {
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/users',
// 				method: 'GET' as const,
// 				success: true,
// 			});
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/posts',
// 				method: 'POST' as const,
// 				success: true,
// 			});

// 			historyService.clearHistory();
// 			const history = historyService.getHistory();

// 			expect(history).toHaveLength(0);
// 		});
// 	});

// 	describe('Filtering and Sorting', () => {
// 		beforeEach(() => {
// 			// Add test data
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/users',
// 				method: 'GET',
// 				status: 200,
// 				success: true,
// 			});
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/posts',
// 				method: 'POST',
// 				status: 201,
// 				success: true,
// 			});
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/error',
// 				method: 'GET',
// 				status: 500,
// 				success: false,
// 				error: 'Internal Server Error',
// 			});
// 		});

// 		test('should filter by method', () => {
// 			const filter: HistoryFilter = {
// 				method: ['GET'],
// 			};

// 			const history = historyService.getHistory(filter);
// 			expect(history).toHaveLength(2);
// 			expect(history.every(item => item.method === 'GET')).toBe(true);
// 		});

// 		test('should filter by success status', () => {
// 			const filter: HistoryFilter = {
// 				status: 'success',
// 			};

// 			const history = historyService.getHistory(filter);
// 			expect(history).toHaveLength(2);
// 			expect(history.every(item => item.success)).toBe(true);
// 		});

// 		test('should filter by error status', () => {
// 			const filter: HistoryFilter = {
// 				status: 'error',
// 			};

// 			const history = historyService.getHistory(filter);
// 			expect(history).toHaveLength(1);
// 			expect(history.every(item => !item.success)).toBe(true);
// 		});

// 		test('should filter by search term', () => {
// 			const filter: HistoryFilter = {
// 				searchTerm: 'users',
// 			};

// 			const history = historyService.getHistory(filter);
// 			expect(history).toHaveLength(1);
// 			expect(history[0].url.includes('users')).toBe(true);
// 		});

// 		test('should filter by date range', () => {
// 			const now = new Date();
// 			const filter: HistoryFilter = {
// 				dateRange: {
// 					start: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
// 					end: now,
// 				},
// 			};

// 			const history = historyService.getHistory(filter);
// 			expect(history.length).toBeGreaterThanOrEqual(0);
// 		});

// 		test('should sort by timestamp ascending', () => {
// 			const sort: HistorySort = {
// 				field: 'timestamp',
// 				direction: 'asc',
// 			};

// 			const history = historyService.getHistory(undefined, sort);
// 			expect(history).toHaveLength(3);

// 			// Check if sorted chronologically (oldest first)
// 			for (let i = 1; i < history.length; i++) {
// 				expect(history[i - 1].timestamp.getTime()).toBeLessThanOrEqual(history[i].timestamp.getTime());
// 			}
// 		});

// 		test('should sort by url descending', () => {
// 			const sort: HistorySort = {
// 				field: 'url',
// 				direction: 'desc',
// 			};

// 			const history = historyService.getHistory(undefined, sort);
// 			expect(history).toHaveLength(3);

// 			// Check if sorted alphabetically (Z-A)
// 			for (let i = 1; i < history.length; i++) {
// 				expect(history[i - 1].url.toLowerCase() >= history[i].url.toLowerCase()).toBe(true);
// 			}
// 		});

// 		test('should combine filter and sort', () => {
// 			const filter: HistoryFilter = {
// 				method: ['GET'],
// 			};
// 			const sort: HistorySort = {
// 				field: 'url',
// 				direction: 'asc',
// 			};

// 			const history = historyService.getHistory(filter, sort);
// 			expect(history).toHaveLength(2);
// 			expect(history.every(item => item.method === 'GET')).toBe(true);
// 			expect(history[0].url <= history[1].url).toBe(true);
// 		});
// 	});

// 	describe('Collection Operations', () => {
// 		test('should save history item to collection', () => {
// 			const request = {
// 				url: 'https://api.example.com/users',
// 				method: 'GET' as const,
// 				success: true,
// 			};

// 			const added = historyService.addToHistory(request);
// 			const saved = historyService.saveToCollection(added.id, 'collection-id', 'folder-id');

// 			expect(saved).toBe(true);

// 			const retrieved = historyService.getHistoryItem(added.id);
// 			expect(retrieved!.collectionId).toBe('collection-id');
// 			expect(retrieved!.folderId).toBe('folder-id');
// 		});

// 		test('should return false when saving non-existent history item', () => {
// 			const saved = historyService.saveToCollection('non-existent', 'collection-id');
// 			expect(saved).toBe(false);
// 		});
// 	});

// 	describe('Export Operations', () => {
// 		beforeEach(() => {
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/users',
// 				method: 'GET',
// 				status: 200,
// 				success: true,
// 			});
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/posts',
// 				method: 'POST',
// 				status: 201,
// 				success: true,
// 			});
// 		});

// 		test('should export history as JSON', () => {
// 			const exported = historyService.exportHistory();

// 			expect(exported.format).toBe('json');
// 			expect(exported.items).toHaveLength(2);
// 			expect(exported.metadata.totalItems).toBe(2);
// 			expect(exported.metadata.exportedAt).toBeInstanceOf(Date);
// 		});

// 		test('should export filtered history', () => {
// 			const filter: HistoryFilter = {
// 				method: ['GET'],
// 			};

// 			const exported = historyService.exportHistory(filter);

// 			expect(exported.items).toHaveLength(1);
// 			expect(exported.items[0].method).toBe('GET');
// 		});

// 		test('should export to CSV format', () => {
// 			const csvData = historyService.exportToFile(undefined, 'csv');

// 			expect(typeof csvData).toBe('string');
// 			expect(csvData).toContain('"ID","URL","Method","Status"');
// 			expect(csvData).toContain('https://api.example.com/users');
// 		});

// 		test('should export to HAR format', () => {
// 			const harData = historyService.exportToFile(undefined, 'har');

// 			expect(typeof harData).toBe('string');
// 			const parsed = JSON.parse(harData);
// 			expect(parsed.log).toBeDefined();
// 			expect(parsed.log.version).toBe('1.2');
// 			expect(parsed.log.entries).toHaveLength(2);
// 		});
// 	});

// 	describe('Statistics', () => {
// 		beforeEach(() => {
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/users',
// 				method: 'GET',
// 				status: 200,
// 				responseTime: 100,
// 				success: true,
// 			});
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/posts',
// 				method: 'POST',
// 				status: 201,
// 				responseTime: 200,
// 				success: true,
// 			});
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/error',
// 				method: 'GET',
// 				status: 500,
// 				responseTime: 50,
// 				success: false,
// 			});
// 		});

// 		test('should calculate basic statistics', () => {
// 			const stats = historyService.getStatistics();

// 			expect(stats.totalRequests).toBe(3);
// 			expect(stats.successfulRequests).toBe(2);
// 			expect(stats.failedRequests).toBe(1);
// 			expect(stats.averageResponseTime).toBeCloseTo(116.67, 2); // (100 + 200 + 50) / 3
// 		});

// 		test('should calculate method distribution', () => {
// 			const stats = historyService.getStatistics();

// 			expect(stats.methodDistribution.GET).toBe(2);
// 			expect(stats.methodDistribution.POST).toBe(1);
// 		});

// 		test('should calculate status distribution', () => {
// 			const stats = historyService.getStatistics();

// 			expect(stats.statusDistribution['2xx']).toBe(2);
// 			expect(stats.statusDistribution['5xx']).toBe(1);
// 		});

// 		test('should get most used URLs', () => {
// 			// Add another request to the same URL
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/users',
// 				method: 'GET',
// 				success: true,
// 			});

// 			const stats = historyService.getStatistics();

// 			expect(stats.mostUsedUrls).toHaveLength(3);
// 			expect(stats.mostUsedUrls[0].url).toBe('https://api.example.com/users');
// 			expect(stats.mostUsedUrls[0].count).toBe(2);
// 		});

// 		test('should calculate recent activity', () => {
// 			const stats = historyService.getStatistics();

// 			expect(stats.recentActivity).toHaveLength(7);
// 			expect(stats.recentActivity.every(day => typeof day.count === 'number')).toBe(true);
// 		});

// 		test('should calculate filtered statistics', () => {
// 			const filter: HistoryFilter = {
// 				status: 'success',
// 			};

// 			const stats = historyService.getStatistics(filter);

// 			expect(stats.totalRequests).toBe(2);
// 			expect(stats.successfulRequests).toBe(2);
// 			expect(stats.failedRequests).toBe(0);
// 		});
// 	});

// 	describe('Configuration', () => {
// 		test('should get default configuration', () => {
// 			const config = historyService.getConfiguration();

// 			expect(config.maxItems).toBe(1000);
// 			expect(config.autoCleanup).toBe(true);
// 			expect(config.cleanupDays).toBe(30);
// 			expect(config.enableStatistics).toBe(true);
// 			expect(config.saveRequestBody).toBe(true);
// 			expect(config.saveResponseData).toBe(false);
// 		});

// 		test('should update configuration', () => {
// 			const newConfig = {
// 				maxItems: 500,
// 				autoCleanup: false,
// 			};

// 			historyService.updateConfiguration(newConfig);
// 			const config = historyService.getConfiguration();

// 			expect(config.maxItems).toBe(500);
// 			expect(config.autoCleanup).toBe(false);
// 			// Other values should remain unchanged
// 			expect(config.cleanupDays).toBe(30);
// 		});
// 	});

// 	describe('Data Persistence', () => {
// 		test('should persist history to localStorage', () => {
// 			const request = {
// 				url: 'https://api.example.com/users',
// 				method: 'GET' as const,
// 				success: true,
// 			};

// 			historyService.addToHistory(request);

// 			const stored = localStorage.getItem('api-client-history');
// 			expect(stored).toBeDefined();

// 			const parsed = JSON.parse(stored!);
// 			expect(parsed).toHaveLength(1);
// 			expect(parsed[0].url).toBe(request.url);
// 		});

// 		test('should handle storage errors gracefully', () => {
// 			// Mock localStorage to throw an error
// 			const originalSetItem = localStorage.setItem;
// 			localStorage.setItem = jest.fn(() => {
// 				throw new Error('Storage full');
// 			});

// 			// Should not throw an error
// 			expect(() => {
// 				historyService.addToHistory({
// 					url: 'https://api.example.com/users',
// 					method: 'GET',
// 					success: true,
// 				});
// 			}).not.toThrow();

// 			// Restore original
// 			localStorage.setItem = originalSetItem;
// 		});
// 	});

// 	describe('Max Items Limit', () => {
// 		test('should enforce max items limit', () => {
// 			// Set a low limit for testing
// 			historyService.updateConfiguration({ maxItems: 2 });

// 			// Add 3 items
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/1',
// 				method: 'GET',
// 				success: true,
// 			});
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/2',
// 				method: 'GET',
// 				success: true,
// 			});
// 			historyService.addToHistory({
// 				url: 'https://api.example.com/3',
// 				method: 'GET',
// 				success: true,
// 			});

// 			const history = historyService.getHistory();
// 			expect(history).toHaveLength(2);
// 			// Should keep the latest items
// 			expect(history[0].url).toBe('https://api.example.com/3');
// 			expect(history[1].url).toBe('https://api.example.com/2');
// 		});
// 	});
// });
