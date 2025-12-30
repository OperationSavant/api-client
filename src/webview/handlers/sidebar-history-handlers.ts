import { setHistory, addHistoryItem, removeHistoryItem, clearHistory } from '@/features/history/sidebar-historySlice';
import type { HistoryItem } from '@/shared/types/history';
import type { AppDispatch } from '@/store/sidebar-store';

interface SidebarHistoryHandlerDependencies {
	dispatch: AppDispatch;
}

export function createSidebarHistoryHandlers({ dispatch }: SidebarHistoryHandlerDependencies) {
	const handleSetHistory = (data: HistoryItem[]) => {
		if (data && Array.isArray(data)) {
			dispatch(setHistory(data));
		}
	};

	const handleAddHistoryItem = (data: HistoryItem) => {
		if (data) {
			dispatch(addHistoryItem(data));
		}
	};

	const handleRemoveHistoryItem = (data: HistoryItem) => {
		if (data && data.historyId) {
			dispatch(removeHistoryItem(data.historyId));
		}
	};

	const handleClearHistory = () => {
		dispatch(clearHistory());
	};

	return {
		handleSetHistory,
		handleAddHistoryItem,
		handleRemoveHistoryItem,
		handleClearHistory,
	};
}
