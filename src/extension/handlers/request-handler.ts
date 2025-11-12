import { WebviewPanel } from 'vscode';
import { RequestExecutorService } from '../services/request-executor';
import { historyService } from '@/domain/services/history-service';
import { StateManager } from '../services/state-manager';
import { HistoryItem } from '@/shared/types/history';

interface RequestHandlerDependencies {
	requestExecutor: RequestExecutorService;
	historyService: typeof historyService;
}

export class RequestHandler {
	constructor(private deps: RequestHandlerDependencies) {}

	async handle(message: any, panel: WebviewPanel): Promise<void> {
		const config = {
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

		this.deps.historyService.addToHistory(historyItem);
		StateManager.saveState();

		panel.webview.postMessage({
			command: 'apiResponse',
			data: {
				status: result.status,
				statusText: result.statusText,
				headers: result.headers,
				body: result.body,
				size: result.size,
				responseTime: result.responseTime,
				isLargeBody: result.isLargeBody,
				bodyFilePath: result.bodyFilePath,
				method: message.method,
				url: message.url,
			},
		});
	}
}
