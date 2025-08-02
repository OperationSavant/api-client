import { RequestHistory, HistoryFilter, HistorySort, HistoryExport, HistoryStatistics, HistoryConfiguration } from '@/types/history';

class HistoryService {
	private history: RequestHistory[] = [];
	private config: HistoryConfiguration = {
		maxItems: 1000,
		autoCleanup: true,
		cleanupDays: 30,
		enableStatistics: true,
		saveRequestBody: true,
		saveResponseData: false
	};

	constructor() {
		this.loadFromStorage();
		this.setupAutoCleanup();
	}

	// CRUD Operations
	addToHistory(request: Omit<RequestHistory, 'id' | 'timestamp'>): RequestHistory {
		const historyItem: RequestHistory = {
			...request,
			id: this.generateId(),
			timestamp: new Date()
		};

		this.history.unshift(historyItem); // Add to beginning for latest first

		// Apply max items limit
		if (this.history.length > this.config.maxItems) {
			this.history = this.history.slice(0, this.config.maxItems);
		}

		this.saveToStorage();
		return historyItem;
	}

	getHistory(filter?: HistoryFilter, sort?: HistorySort): RequestHistory[] {
		let filteredHistory = [...this.history];

		// Apply filters
		if (filter) {
			if (filter.method && filter.method.length > 0) {
				filteredHistory = filteredHistory.filter(item => 
					filter.method!.includes(item.method)
				);
			}

			if (filter.status && filter.status !== 'all') {
				filteredHistory = filteredHistory.filter(item => {
					if (filter.status === 'success') return item.success;
					if (filter.status === 'error') return !item.success;
					return true;
				});
			}

			if (filter.dateRange) {
				filteredHistory = filteredHistory.filter(item => 
					item.timestamp >= filter.dateRange!.start && 
					item.timestamp <= filter.dateRange!.end
				);
			}

			if (filter.searchTerm) {
				const searchLower = filter.searchTerm.toLowerCase();
				filteredHistory = filteredHistory.filter(item => 
					item.url.toLowerCase().includes(searchLower) ||
					item.statusText?.toLowerCase().includes(searchLower) ||
					item.error?.toLowerCase().includes(searchLower)
				);
			}

			if (filter.collectionId) {
				filteredHistory = filteredHistory.filter(item => 
					item.collectionId === filter.collectionId
				);
			}
		}

		// Apply sorting
		if (sort) {
			filteredHistory.sort((a, b) => {
				let aValue: any = a[sort.field];
				let bValue: any = b[sort.field];

				// Handle date sorting
				if (sort.field === 'timestamp') {
					aValue = aValue.getTime();
					bValue = bValue.getTime();
				}

				// Handle string sorting
				if (typeof aValue === 'string') {
					aValue = aValue.toLowerCase();
					bValue = bValue.toLowerCase();
				}

				// Handle undefined values
				if (aValue === undefined) aValue = sort.direction === 'asc' ? Infinity : -Infinity;
				if (bValue === undefined) bValue = sort.direction === 'asc' ? Infinity : -Infinity;

				if (sort.direction === 'asc') {
					return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
				} else {
					return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
				}
			});
		}

		return filteredHistory;
	}

	getHistoryItem(id: string): RequestHistory | undefined {
		return this.history.find(item => item.id === id);
	}

	deleteHistoryItem(id: string): boolean {
		const index = this.history.findIndex(item => item.id === id);
		if (index !== -1) {
			this.history.splice(index, 1);
			this.saveToStorage();
			return true;
		}
		return false;
	}

	deleteMultipleItems(ids: string[]): number {
		let deletedCount = 0;
		ids.forEach(id => {
			if (this.deleteHistoryItem(id)) {
				deletedCount++;
			}
		});
		return deletedCount;
	}

	clearHistory(): void {
		this.history = [];
		this.saveToStorage();
	}

	clearHistoryByFilter(filter: HistoryFilter): number {
		const itemsToDelete = this.getHistory(filter);
		const idsToDelete = itemsToDelete.map(item => item.id);
		return this.deleteMultipleItems(idsToDelete);
	}

	// Collection Operations
	saveToCollection(historyId: string, collectionId: string, folderId?: string): boolean {
		const historyItem = this.getHistoryItem(historyId);
		if (!historyItem) return false;

		// Update the history item with collection info
		historyItem.collectionId = collectionId;
		historyItem.folderId = folderId;

		this.saveToStorage();

		// TODO: Integrate with collection service to actually save the request
		// This would require importing the collection service and creating a new request
		return true;
	}

	// Export Operations
	exportHistory(filter?: HistoryFilter, format: 'json' | 'csv' | 'har' = 'json'): HistoryExport {
		const items = this.getHistory(filter);
		
		const exportData: HistoryExport = {
			format,
			items,
			metadata: {
				exportedAt: new Date(),
				totalItems: items.length,
				dateRange: filter?.dateRange
			}
		};

		return exportData;
	}

	exportToFile(filter?: HistoryFilter, format: 'json' | 'csv' | 'har' = 'json'): string {
		const exportData = this.exportHistory(filter, format);

		switch (format) {
			case 'json':
				return JSON.stringify(exportData, null, 2);
			
			case 'csv':
				return this.convertToCSV(exportData.items);
			
			case 'har':
				return this.convertToHAR(exportData.items);
			
			default:
				return JSON.stringify(exportData, null, 2);
		}
	}

	// Statistics
	getStatistics(filter?: HistoryFilter): HistoryStatistics {
		const items = this.getHistory(filter);

		const stats: HistoryStatistics = {
			totalRequests: items.length,
			successfulRequests: items.filter(item => item.success).length,
			failedRequests: items.filter(item => !item.success).length,
			averageResponseTime: 0,
			methodDistribution: {},
			statusDistribution: {},
			mostUsedUrls: [],
			recentActivity: []
		};

		if (items.length === 0) return stats;

		// Calculate average response time
		const responseTimes = items
			.filter(item => item.responseTime !== undefined)
			.map(item => item.responseTime!);
		
		if (responseTimes.length > 0) {
			stats.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
		}

		// Method distribution
		items.forEach(item => {
			stats.methodDistribution[item.method] = (stats.methodDistribution[item.method] || 0) + 1;
		});

		// Status distribution
		items.forEach(item => {
			const statusGroup = item.status ? Math.floor(item.status / 100) + 'xx' : 'unknown';
			stats.statusDistribution[statusGroup] = (stats.statusDistribution[statusGroup] || 0) + 1;
		});

		// Most used URLs
		const urlCounts: Record<string, number> = {};
		items.forEach(item => {
			urlCounts[item.url] = (urlCounts[item.url] || 0) + 1;
		});

		stats.mostUsedUrls = Object.entries(urlCounts)
			.map(([url, count]) => ({ url, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		// Recent activity (last 7 days)
		const last7Days = Array.from({ length: 7 }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - i);
			return date.toISOString().split('T')[0];
		}).reverse();

		stats.recentActivity = last7Days.map(date => {
			const dayStart = new Date(date + 'T00:00:00');
			const dayEnd = new Date(date + 'T23:59:59');
			const count = items.filter(item => 
				item.timestamp >= dayStart && item.timestamp <= dayEnd
			).length;
			return { date, count };
		});

		return stats;
	}

	// Configuration
	getConfiguration(): HistoryConfiguration {
		return { ...this.config };
	}

	updateConfiguration(newConfig: Partial<HistoryConfiguration>): void {
		this.config = { ...this.config, ...newConfig };
		this.saveConfigToStorage();
		this.setupAutoCleanup();
	}

	// Private helper methods
	private generateId(): string {
		return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private setupAutoCleanup(): void {
		if (!this.config.autoCleanup) return;

		// Clean up old items based on cleanupDays
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - this.config.cleanupDays);

		const initialLength = this.history.length;
		this.history = this.history.filter(item => item.timestamp >= cutoffDate);

		if (this.history.length !== initialLength) {
			this.saveToStorage();
		}
	}

	private convertToCSV(items: RequestHistory[]): string {
		if (items.length === 0) return '';

		const headers = ['ID', 'URL', 'Method', 'Status', 'Response Time', 'Timestamp', 'Success', 'Error'];
		const rows = items.map(item => [
			item.id,
			item.url,
			item.method,
			item.status?.toString() || '',
			item.responseTime?.toString() || '',
			item.timestamp.toISOString(),
			item.success.toString(),
			item.error || ''
		]);

		return [headers, ...rows]
			.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
			.join('\n');
	}

	private convertToHAR(items: RequestHistory[]): string {
		// Basic HAR (HTTP Archive) format structure
		const har = {
			log: {
				version: '1.2',
				creator: {
					name: 'VS Code API Client',
					version: '1.0.0'
				},
				entries: items.map(item => ({
					startedDateTime: item.timestamp.toISOString(),
					time: item.responseTime || 0,
					request: {
						method: item.method,
						url: item.url,
						httpVersion: 'HTTP/1.1',
						headers: Object.entries(item.headers || {}).map(([name, value]) => ({ name, value })),
						queryString: [],
						cookies: [],
						headersSize: -1,
						bodySize: item.requestSize || -1,
						postData: item.body ? {
							mimeType: 'application/json',
							text: JSON.stringify(item.body)
						} : undefined
					},
					response: {
						status: item.status || 0,
						statusText: item.statusText || '',
						httpVersion: 'HTTP/1.1',
						headers: [],
						cookies: [],
						content: {
							size: item.responseSize || 0,
							mimeType: 'application/json'
						},
						redirectURL: '',
						headersSize: -1,
						bodySize: item.responseSize || -1
					},
					cache: {},
					timings: {
						send: 0,
						wait: item.responseTime || 0,
						receive: 0
					}
				}))
			}
		};

		return JSON.stringify(har, null, 2);
	}

	private loadFromStorage(): void {
		try {
			const stored = localStorage.getItem('api-client-history');
			if (stored) {
				const parsed = JSON.parse(stored);
				this.history = parsed.map((item: any) => ({
					...item,
					timestamp: new Date(item.timestamp)
				}));
			}

			const configStored = localStorage.getItem('api-client-history-config');
			if (configStored) {
				this.config = { ...this.config, ...JSON.parse(configStored) };
			}
		} catch (error) {
			console.error('Failed to load history from storage:', error);
			this.history = [];
		}
	}

	private saveToStorage(): void {
		try {
			localStorage.setItem('api-client-history', JSON.stringify(this.history));
		} catch (error) {
			console.error('Failed to save history to storage:', error);
		}
	}

	private saveConfigToStorage(): void {
		try {
			localStorage.setItem('api-client-history-config', JSON.stringify(this.config));
		} catch (error) {
			console.error('Failed to save history config to storage:', error);
		}
	}
}

export const historyService = new HistoryService();
