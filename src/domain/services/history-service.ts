import { HistoryItem, HistoryFilter, HistorySort, HistoryExport, HistoryStatistics, HistoryConfiguration } from '@/shared/types/history';
import type { IHistoryPersistence } from '@/domain/types/history-persistence';
import { unitOfWork } from './unit-of-work';

class HistoryService {
	private static instance: HistoryService;
	private history: Map<string, HistoryItem> = new Map();
	private persistence: IHistoryPersistence | null = null;

	static getInstance(): HistoryService {
		if (!HistoryService.instance) {
			HistoryService.instance = new HistoryService();
		}
		return HistoryService.instance;
	}

	private config: HistoryConfiguration = {
		maxItems: 1000,
		autoCleanup: true,
		cleanupDays: 30,
		enableStatistics: true,
		saveRequestBody: true,
		saveResponseData: false,
	};

	setPersistence(adapter: IHistoryPersistence): void {
		this.persistence = adapter;
	}

	async loadFromPersistence(): Promise<void> {
		if (!this.persistence) {
			console.warn('No history persistence adapter set');
			return;
		}

		const items = await this.persistence.loadAll(this.config.maxItems);
		this.history.clear();
		items.forEach(item => {
			this.history.set(item.historyId, item);
		});
	}

	// constructor() {
	// 	this.loadFromStorage();
	// 	this.setupAutoCleanup();
	// }

	// CRUD Operations
	addToHistory(request: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
		const historyItem: HistoryItem = {
			...request,
			historyId: this.generateId(),
			timestamp: new Date(),
		};

		this.history.set(historyItem.historyId, historyItem);

		// Register with Unit of Work for persistence
		unitOfWork.registerNew(historyItem, 'history');

		return historyItem;
	}

	getAllHistory(): HistoryItem[] {
		return Array.from(this.history.values());
	}

	// getHistoryItem(id: string): HistoryItem | undefined {
	// 	return this.history.find(item => item.id === id);
	// }

	// deleteHistoryItem(id: string): boolean {
	// 	const index = this.history.findIndex(item => item.id === id);
	// 	if (index !== -1) {
	// 		this.history.splice(index, 1);
	// 		this.saveToStorage();
	// 		return true;
	// 	}
	// 	return false;
	// }

	// deleteMultipleItems(ids: string[]): number {
	// 	let deletedCount = 0;
	// 	ids.forEach(id => {
	// 		if (this.deleteHistoryItem(id)) {
	// 			deletedCount++;
	// 		}
	// 	});
	// 	return deletedCount;
	// }

	clearHistory(): void {
		// Register all items for removal
		const items = Array.from(this.history.values());
		items.forEach(item => {
			unitOfWork.registerRemoved(item, 'history');
		});

		this.history.clear();
	}

	deleteHistoryItem(historyId: string): void {
		const item = this.history.get(historyId);
		if (!item) return;

		this.history.delete(historyId);

		// Register with Unit of Work for persistence
		unitOfWork.registerRemoved(item, 'history');
	}

	// clearHistoryByFilter(filter: HistoryFilter): number {
	// 	const itemsToDelete = this.getHistory(filter);
	// 	const idsToDelete = itemsToDelete.map(item => item.id);
	// 	return this.deleteMultipleItems(idsToDelete);
	// }

	// Collection Operations
	// saveToCollection(historyId: string, collectionId: string, folderId?: string): boolean {
	// 	const historyItem = this.getHistoryItem(historyId);
	// 	if (!historyItem) return false;

	// 	// Update the history item with collection info
	// 	historyItem.collectionId = collectionId;
	// 	historyItem.folderId = folderId;

	// 	this.saveToStorage();

	// 	// TODO: Integrate with collection service to actually save the request
	// 	// This would require importing the collection service and creating a new request
	// 	return true;
	// }

	// Export Operations
	// exportHistory(filter?: HistoryFilter, format: 'json' | 'csv' | 'har' = 'json'): HistoryExport {
	// 	const items = this.getHistory(filter);

	// 	const exportData: HistoryExport = {
	// 		format,
	// 		items,
	// 		metadata: {
	// 			exportedAt: new Date(),
	// 			totalItems: items.length,
	// 			dateRange: filter?.dateRange,
	// 		},
	// 	};

	// 	return exportData;
	// }

	// exportToFile(filter?: HistoryFilter, format: 'json' | 'csv' | 'har' = 'json'): string {
	// 	const exportData = this.exportHistory(filter, format);

	// 	switch (format) {
	// 		case 'json':
	// 			return JSON.stringify(exportData, null, 2);

	// 		case 'csv':
	// 			return this.convertToCSV(exportData.items);

	// 		case 'har':
	// 			return this.convertToHAR(exportData.items);

	// 		default:
	// 			return JSON.stringify(exportData, null, 2);
	// 	}
	// }

	// Statistics
	// getStatistics(filter?: HistoryFilter): HistoryStatistics {
	// 	const items = this.getHistory(filter);

	// 	const stats: HistoryStatistics = {
	// 		totalRequests: items.length,
	// 		successfulRequests: items.filter(item => item.success).length,
	// 		failedRequests: items.filter(item => !item.success).length,
	// 		averageResponseTime: 0,
	// 		methodDistribution: {},
	// 		statusDistribution: {},
	// 		mostUsedUrls: [],
	// 		recentActivity: [],
	// 	};

	// 	if (items.length === 0) return stats;

	// 	// Calculate average response time
	// 	const responseTimes = items.filter(item => item.responseTime !== undefined).map(item => item.responseTime!);

	// 	if (responseTimes.length > 0) {
	// 		stats.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
	// 	}

	// 	// Method distribution
	// 	items.forEach(item => {
	// 		stats.methodDistribution[item.method] = (stats.methodDistribution[item.method] || 0) + 1;
	// 	});

	// 	// Status distribution
	// 	items.forEach(item => {
	// 		const statusGroup = item.status ? Math.floor(item.status / 100) + 'xx' : 'unknown';
	// 		stats.statusDistribution[statusGroup] = (stats.statusDistribution[statusGroup] || 0) + 1;
	// 	});

	// 	// Most used URLs
	// 	const urlCounts: Record<string, number> = {};
	// 	items.forEach(item => {
	// 		urlCounts[item.url] = (urlCounts[item.url] || 0) + 1;
	// 	});

	// 	stats.mostUsedUrls = Object.entries(urlCounts)
	// 		.map(([url, count]) => ({ url, count }))
	// 		.sort((a, b) => b.count - a.count)
	// 		.slice(0, 10);

	// 	// Recent activity (last 7 days)
	// 	const last7Days = Array.from({ length: 7 }, (_, i) => {
	// 		const date = new Date();
	// 		date.setDate(date.getDate() - i);
	// 		return date.toISOString().split('T')[0];
	// 	}).reverse();

	// 	stats.recentActivity = last7Days.map(date => {
	// 		const dayStart = new Date(date + 'T00:00:00');
	// 		const dayEnd = new Date(date + 'T23:59:59');
	// 		const count = items.filter(item => item.timestamp >= dayStart && item.timestamp <= dayEnd).length;
	// 		return { date, count };
	// 	});

	// 	return stats;
	// }

	// Configuration
	getConfiguration(): HistoryConfiguration {
		return { ...this.config };
	}

	// updateConfiguration(newConfig: Partial<HistoryConfiguration>): void {
	// 	this.config = { ...this.config, ...newConfig };
	// 	this.saveConfigToStorage();
	// 	this.setupAutoCleanup();
	// }

	// Private helper methods
	private generateId(): string {
		return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// private setupAutoCleanup(): void {
	// 	if (!this.config.autoCleanup) return;

	// 	// Clean up old items based on cleanupDays
	// 	const cutoffDate = new Date();
	// 	cutoffDate.setDate(cutoffDate.getDate() - this.config.cleanupDays);

	// 	const initialLength = this.history.length;
	// 	this.history = this.history.filter(item => item.timestamp >= cutoffDate);

	// 	if (this.history.length !== initialLength) {
	// 		this.saveToStorage();
	// 	}
	// }

	// private convertToCSV(items: HistoryItem[]): string {
	// 	if (items.length === 0) return '';

	// 	const headers = ['ID', 'URL', 'Method', 'Status', 'Response Time', 'Timestamp', 'Success', 'Error'];
	// 	const rows = items.map(item => [
	// 		item.id,
	// 		item.url,
	// 		item.method,
	// 		item.status?.toString() || '',
	// 		item.responseTime?.toString() || '',
	// 		item.timestamp.toISOString(),
	// 		item.success.toString(),
	// 		item.error || '',
	// 	]);

	// 	return [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
	// }

	// private convertToHAR(items: HistoryItem[]): string {
	// 	// Basic HAR (HTTP Archive) format structure
	// 	const har = {
	// 		log: {
	// 			version: '1.2',
	// 			creator: {
	// 				name: 'VS Code API Client',
	// 				version: '1.0.0',
	// 			},
	// 			entries: items.map(item => ({
	// 				startedDateTime: item.timestamp.toISOString(),
	// 				time: item.responseTime || 0,
	// 				request: {
	// 					method: item.method,
	// 					url: item.url,
	// 					httpVersion: 'HTTP/1.1',
	// 					headers: Object.entries(item.headers || {}).map(([name, value]) => ({ name, value })),
	// 					queryString: [],
	// 					cookies: [],
	// 					headersSize: -1,
	// 					bodySize: item.requestSize || -1,
	// 					postData: item.body
	// 						? {
	// 								mimeType: 'application/json',
	// 								text: JSON.stringify(item.body),
	// 							}
	// 						: undefined,
	// 				},
	// 				response: {
	// 					status: item.status || 0,
	// 					statusText: item.statusText || '',
	// 					httpVersion: 'HTTP/1.1',
	// 					headers: [],
	// 					cookies: [],
	// 					content: {
	// 						size: item.responseSize || 0,
	// 						mimeType: 'application/json',
	// 					},
	// 					redirectURL: '',
	// 					headersSize: -1,
	// 					bodySize: item.responseSize || -1,
	// 				},
	// 				cache: {},
	// 				timings: {
	// 					send: 0,
	// 					wait: item.responseTime || 0,
	// 					receive: 0,
	// 				},
	// 			})),
	// 		},
	// 	};

	// 	return JSON.stringify(har, null, 2);
	// }

	public exportData(): [string, HistoryItem][] {
		return Array.from(this.history.entries());
	}

	public importData(data: [string, HistoryItem][]): void {
		if (data && Array.isArray(data)) {
			const revivedData = data.map(([id, history]) => {
				const revivedHistory: HistoryItem = { ...history, timestamp: new Date(history.timestamp) };
				return [id, revivedHistory] as [string, HistoryItem];
			});
			this.history = new Map(revivedData);
		} else {
			this.history = new Map();
		}
	}
}

export const historyService = HistoryService.getInstance();
