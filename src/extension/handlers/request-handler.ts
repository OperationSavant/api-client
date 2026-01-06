import { historyService } from '@/domain/services/history-service';
import { unitOfWork } from '@/domain/services/unit-of-work';
import type { RequestExecutorService } from '../services/request-executor';
import { broadcasterHub } from '../orchestrators/broadcaster-hub';
import type { HistoryItem } from '@/shared/types/history';
import type { Request } from '@/shared/types/request';
import { SERVER_COMMANDS } from '@/shared/constants/commands';

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
				request: { ...message },
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
				command: SERVER_COMMANDS.ADD_HISTORY,
				data: savedHistoryItem,
			});

			broadcasterHub.broadcast({
				command: SERVER_COMMANDS.API_RESPONSE,
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
