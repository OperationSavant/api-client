import type { WebviewPanel } from 'vscode';
import type { RequestExecutionConfig, RequestExecutorService } from '../services/request-executor';
import { historyService } from '@/domain/services/history-service';
import { unitOfWork } from '@/domain/services/unit-of-work';
import { StateManager } from '../services/state-manager';
import type { HistoryItem } from '@/shared/types/history';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';

interface RequestHandlerDependencies {
	requestExecutor: RequestExecutorService;
}

export class RequestHandler {
	constructor(private deps: RequestHandlerDependencies) {}

	async handle(message: any, panel: WebviewPanel): Promise<void> {
		try {
			const config: RequestExecutionConfig = {
				url: message.url,
				method: message.method,
				headers: message.headers || {},
				params: message.params,
				bodyConfig: message.bodyConfig,
				auth: message.auth,
			};

			const result = await this.deps.requestExecutor.execute(config);

			const historyItem: HistoryItem = {
				historyId: Date.now().toString(),
				request: {
					url: message.url,
					method: message.method,
					headers: message.headers,
					params: message.params,
					body: message.bodyConfig,
					auth: message.auth,
				},
				response: {
					status: result.status,
					statusText: result.statusText,
					headers: result.headers,
					body: result.body,
					size: result.size,
					isLargeBody: result.isLargeBody,
					bodyFilePath: result.bodyFilePath,
					isError: result.isError,
					error: result.error,
					contentType: result.headers['content-type'] || '',
					duration: result.responseTime,
				},
				timestamp: new Date(),
				success: !result.isError,
				error: result.error,
			};

			// Domain operation (synchronous)
			const savedHistoryItem = historyService.addToHistory(historyItem);

			// Commit to database (async)
			await unitOfWork.commit();

			// Broadcast new history item to all panels
			broadcasterHub.broadcast({
				command: 'historyItemAdded',
				historyItem: savedHistoryItem,
			});

			broadcasterHub.broadcast({
				command: 'apiResponse',
				data: {
					status: result.status,
					statusText: result.statusText,
					headers: result.headers,
					body: result.body,
					size: result.size,
					duration: result.responseTime,
					isLargeBody: result.isLargeBody,
					bodyFilePath: result.bodyFilePath,
					method: message.method,
					url: message.url,
				},
			});
		} catch (error) {
			console.error('[RequestHandler] Failed to handle request:', error);

			// Rollback in-memory changes
			unitOfWork.rollback();

			// Broadcast error to webview
			broadcasterHub.broadcast({ command: 'error' });

			broadcasterHub.broadcastException(`Request execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
}
