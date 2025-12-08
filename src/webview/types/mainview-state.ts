import { EditorUIState } from '@/features/editor/editorUISlice';
import { RequestState } from '@/features/request/requestSlice';

export interface MainViewState {
	request: RequestState;
	ui: EditorUIState;
}
