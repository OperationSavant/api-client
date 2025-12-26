import type { EditorUIState } from '@/features/editor/editorUISlice';
import type { RequestState } from '@/features/request/requestSlice';

export interface MainViewState {
	request: RequestState;
	ui: EditorUIState;
}
