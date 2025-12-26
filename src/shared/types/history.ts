import type { Request } from './request';
import type { Response } from './response';

// export interface RequestHistory {
// 	id: string;
// 	url: string;
// 	method: HttpVerb;
// 	timestamp: Date;
// 	status?: number;
// 	statusText?: string;
// 	responseTime?: number;
// 	requestSize?: number;
// 	responseSize?: number;
// 	responseData?: Response;
// 	headers?: Record<string, string>;
// 	body?: any;
// 	bodyType?: BodyType;
// 	auth?: {
// 		type: string;
// 		[key: string]: any;
// 	};
// 	collectionId?: string;
// 	folderId?: string;
// 	success: boolean;
// 	error?: string;
// }

export interface HistoryItem {
	historyId: string;
	request: Request;
	requestSize?: number;
	timestamp: Date;
	response?: Response;
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
	items: HistoryItem[];
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
