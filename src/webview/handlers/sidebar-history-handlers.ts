import { setHistory, addHistoryItem, removeHistoryItem, clearHistory } from '@/features/history/sidebar-historySlice';
import type { AppDispatch } from '@/store/sidebar-store';

interface SidebarHistoryHandlerDependencies {
	dispatch: AppDispatch;
}

export function createSidebarHistoryHandlers(deps: SidebarHistoryHandlerDependencies) {
	const handleSetHistory = (data: any) => {
		if (data && data.history && Array.isArray(data.history)) {
			deps.dispatch(setHistory(data.history));
		}
	};

	const handleAddHistoryItem = (data: any) => {
		if (data && data.historyItem) {
			deps.dispatch(addHistoryItem(data.historyItem));
		}
	};

	const handleRemoveHistoryItem = (data: any) => {
		if (data && data.historyId) {
			deps.dispatch(removeHistoryItem(data.historyId));
		}
	};

	const handleClearHistory = () => {
		deps.dispatch(clearHistory());
	};

	return {
		handleSetHistory,
		handleAddHistoryItem,
		handleRemoveHistoryItem,
		handleClearHistory,
	};
}
