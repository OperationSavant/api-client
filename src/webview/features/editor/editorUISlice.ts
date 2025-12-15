import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Editor UI State
 * Contains ONLY transient UI state that does NOT:
 * - Get sent to API
 * - Get saved to collections
 * - Need to persist across sessions
 *
 * Examples:
 * - Active tab selection
 * - Whether request is saved (derived from id existence)
 * - Panel collapse states
 * - Loading indicators
 * - Error messages
 * - Validation states
 */
export interface EditorUIState {
	// Tab Navigation
	activeRequestTab: string;
	activeResponseTab: string;
	activeResponseBodyTab: string;

	// Request State Flags
	isSaved: boolean; // Is current request saved in collection?
	isDirty: boolean; // Has request been modified since last save?

	// Loading States
	isExecuting: boolean; // Is request currently executing?
	isSaving: boolean; // Is request currently being saved?

	// Panel States
	isResponsePanelVisible: boolean;
	responsePanelSize: 'default' | 'maximized' | 'minimized';

	// Validation
	validationErrors: {
		url?: string;
		auth?: string;
		body?: string;
	};

	// Dialogs
	isSaveDialogOpen: boolean;
	isDeleteDialogOpen: boolean;

	// History/Undo (future)
	canUndo: boolean;
	canRedo: boolean;
}

const initialState: EditorUIState = {
	// Tab Navigation
	activeRequestTab: 'params',
	activeResponseTab: 'body',
	activeResponseBodyTab: 'default',

	// Request State
	isSaved: false,
	isDirty: false,

	// Loading States
	isExecuting: false,
	isSaving: false,

	// Panel States
	isResponsePanelVisible: false,
	responsePanelSize: 'default',

	// Validation
	validationErrors: {},

	// Dialogs
	isSaveDialogOpen: false,
	isDeleteDialogOpen: false,

	// History
	canUndo: false,
	canRedo: false,
};

const editorUISlice = createSlice({
	name: 'editorUI',
	initialState,
	reducers: {
		// ============================================================================
		// Default state
		// ============================================================================
		setEditorUIState: (state, action: PayloadAction<EditorUIState>) => {
			return action.payload;
		},
		// ============================================================================
		// TAB NAVIGATION
		// ============================================================================
		setActiveRequestTab: (state, action: PayloadAction<string>) => {
			state.activeRequestTab = action.payload;
		},
		setActiveResponseTab: (state, action: PayloadAction<string>) => {
			state.activeResponseTab = action.payload;
		},
		setActiveResponseBodyTab: (state, action: PayloadAction<string>) => {
			state.activeResponseBodyTab = action.payload;
		},
		// ============================================================================
		// REQUEST STATE FLAGS
		// ============================================================================
		setIsSaved: (state, action: PayloadAction<boolean>) => {
			state.isSaved = action.payload;
		},
		setIsDirty: (state, action: PayloadAction<boolean>) => {
			state.isDirty = action.payload;
		},

		/**
		 * Mark request as saved (after successful save)
		 */
		markAsSaved: state => {
			state.isSaved = true;
			state.isDirty = false;
		},

		/**
		 * Mark request as dirty (after any edit)
		 */
		markAsDirty: state => {
			state.isDirty = true;
		},

		/**
		 * Reset saved/dirty flags (when loading new request)
		 */
		resetRequestFlags: state => {
			state.isSaved = false;
			state.isDirty = false;
		},

		// ============================================================================
		// LOADING STATES
		// ============================================================================
		setIsExecuting: (state, action: PayloadAction<boolean>) => {
			state.isExecuting = action.payload;
		},
		setIsSaving: (state, action: PayloadAction<boolean>) => {
			state.isSaving = action.payload;
		},

		// ============================================================================
		// PANEL STATES
		// ============================================================================
		setIsResponsePanelVisible: (state, action: PayloadAction<boolean>) => {
			state.isResponsePanelVisible = action.payload;
		},
		setResponsePanelSize: (state, action: PayloadAction<'default' | 'maximized' | 'minimized'>) => {
			state.responsePanelSize = action.payload;
		},
		toggleResponsePanelSize: state => {
			// Cycle through: default → maximized → minimized → default
			switch (state.responsePanelSize) {
				case 'default':
					state.responsePanelSize = 'maximized';
					break;
				case 'maximized':
					state.responsePanelSize = 'minimized';
					break;
				case 'minimized':
					state.responsePanelSize = 'default';
					break;
			}
		},

		// ============================================================================
		// VALIDATION
		// ============================================================================
		setValidationError: (state, action: PayloadAction<{ field: 'url' | 'auth' | 'body'; error: string }>) => {
			state.validationErrors[action.payload.field] = action.payload.error;
		},
		clearValidationError: (state, action: PayloadAction<'url' | 'auth' | 'body'>) => {
			delete state.validationErrors[action.payload];
		},
		clearAllValidationErrors: state => {
			state.validationErrors = {};
		},

		// ============================================================================
		// DIALOGS
		// ============================================================================
		setIsSaveDialogOpen: (state, action: PayloadAction<boolean>) => {
			state.isSaveDialogOpen = action.payload;
		},
		setIsDeleteDialogOpen: (state, action: PayloadAction<boolean>) => {
			state.isDeleteDialogOpen = action.payload;
		},

		// ============================================================================
		// HISTORY (Future)
		// ============================================================================
		setCanUndo: (state, action: PayloadAction<boolean>) => {
			state.canUndo = action.payload;
		},
		setCanRedo: (state, action: PayloadAction<boolean>) => {
			state.canRedo = action.payload;
		},

		// ============================================================================
		// RESET
		// ============================================================================
		resetEditorUI: () => {
			return initialState;
		},
	},
});

export const {
	// Default State
	setEditorUIState,
	// Tab Navigation
	setActiveRequestTab,
	setActiveResponseTab,
	setActiveResponseBodyTab,
	// Request State
	setIsSaved,
	setIsDirty,
	markAsSaved,
	markAsDirty,
	resetRequestFlags,

	// Loading States
	setIsExecuting,
	setIsSaving,

	// Panel States
	setIsResponsePanelVisible,
	setResponsePanelSize,
	toggleResponsePanelSize,

	// Validation
	setValidationError,
	clearValidationError,
	clearAllValidationErrors,

	// Dialogs
	setIsSaveDialogOpen,
	setIsDeleteDialogOpen,

	// History
	setCanUndo,
	setCanRedo,

	// Reset
	resetEditorUI,
} = editorUISlice.actions;

export default editorUISlice.reducer;
