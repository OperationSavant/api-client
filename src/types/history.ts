export interface RequestHistory {
	id: string;
	url: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
	timestamp: Date;
	status?: number;
	statusText?: string;
	responseTime?: number;
	requestSize?: number;
	responseSize?: number;
	headers?: Record<string, string>;
	body?: any;
	bodyType?: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql';
	auth?: {
		type: string;
		[key: string]: any;
	};
	collectionId?: string;
	folderId?: string;
	success: boolean;
	error?: string;
}

export interface HistoryFilter {
	method?: string[];
	status?: 'success' | 'error' | 'all';
	dateRange?: {
		start: Date;
		end: Date;
	};
	searchTerm?: string;
	collectionId?: string;
}

export interface HistorySort {
	field: 'timestamp' | 'url' | 'method' | 'status' | 'responseTime';
	direction: 'asc' | 'desc';
}

export interface HistoryExport {
	format: 'json' | 'csv' | 'har';
	items: RequestHistory[];
	metadata: {
		exportedAt: Date;
		totalItems: number;
		dateRange?: {
			start: Date;
			end: Date;
		};
	};
}

export interface HistoryStatistics {
	totalRequests: number;
	successfulRequests: number;
	failedRequests: number;
	averageResponseTime: number;
	methodDistribution: Record<string, number>;
	statusDistribution: Record<string, number>;
	mostUsedUrls: Array<{
		url: string;
		count: number;
	}>;
	recentActivity: Array<{
		date: string;
		count: number;
	}>;
}

export interface HistoryConfiguration {
	maxItems: number;
	autoCleanup: boolean;
	cleanupDays: number;
	enableStatistics: boolean;
	saveRequestBody: boolean;
	saveResponseData: boolean;
}
