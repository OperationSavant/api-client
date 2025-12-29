import { historyService } from '@/domain/services/history-service';
import { unitOfWork } from '@/domain/services/unit-of-work';
import type { RequestExecutorService } from '../services/request-executor';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';
import type { HistoryItem } from '@/shared/types/history';
import type { Request } from '@/shared/types/request';

interface RequestHandlerDependencies {
	requestExecutor: RequestExecutorService;
}

export class RequestHandler {
	constructor(private deps: RequestHandlerDependencies) {}

	async handle(message: Request): Promise<void> {
		try {
			const result = await this.deps.requestExecutor.execute(message);

			const historyItem: HistoryItem = {
				historyId: Date.now().toString(),
				request: {
					url: message.url,
					method: message.method,
					headers: message.headers,
					params: message.params,
					body: message.body,
					auth: message.auth,
				},
				response: { ...result },
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
				data: { ...result },
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
