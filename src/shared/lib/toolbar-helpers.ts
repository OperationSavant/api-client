import type { MonacoEditorHandle } from '@/shared/types/monaco';

export const handleHeadingClick = (editorRef: React.RefObject<MonacoEditorHandle | null>) => {
	const editor = editorRef.current?.getEditor();
	if (!editor) {
		return;
	}
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (selection && model) {
		const selectedText = model.getValueInRange(selection);
		const newText = `## ${selectedText}`;

		const op = {
			range: selection,
			text: newText,
			forceMoveMarkers: true,
		};
		editor.executeEdits('my-source', [op]);
		if (!selectedText) {
			const newPosition = {
				lineNumber: selection.startLineNumber,
				column: selection.startColumn + 3,
			};
			editor.setPosition(newPosition);
		}
		editor.focus();
	}
};

export const handleBoldClick = (editorRef: React.RefObject<MonacoEditorHandle | null>) => {
	const editor = editorRef.current?.getEditor();
	if (!editor) {
		return;
	}
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (selection && model) {
		const selectedText = model.getValueInRange(selection);
		const newText = `**${selectedText}**`;

		const op = {
			range: selection,
			text: newText,
			forceMoveMarkers: true,
		};
		editor.executeEdits('my-source', [op]);
		if (!selectedText) {
			const newPosition = {
				lineNumber: selection.startLineNumber,
				column: selection.startColumn + 2,
			};
			editor.setPosition(newPosition);
		}
		editor.focus();
	}
};

export const handleItalicClick = (editorRef: React.RefObject<MonacoEditorHandle | null>) => {
	const editor = editorRef.current?.getEditor();
	if (!editor) {
		return;
	}
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (selection && model) {
		const selectedText = model.getValueInRange(selection);
		const newText = `*${selectedText}*`;

		const op = {
			range: selection,
			text: newText,
			forceMoveMarkers: true,
		};
		editor.executeEdits('my-source', [op]);
		if (!selectedText) {
			const newPosition = {
				lineNumber: selection.startLineNumber,
				column: selection.startColumn + 1,
			};
			editor.setPosition(newPosition);
		}
		editor.focus();
	}
};

export const handleQuoteClick = (editorRef: React.RefObject<MonacoEditorHandle | null>) => {
	const editor = editorRef.current?.getEditor();
	if (!editor) {
		return;
	}
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (selection && model) {
		const selectedText = model.getValueInRange(selection);
		const newText = `> ${selectedText}`;

		const op = {
			range: selection,
			text: newText,
			forceMoveMarkers: true,
		};
		editor.executeEdits('my-source', [op]);
		if (!selectedText) {
			const newPosition = {
				lineNumber: selection.startLineNumber,
				column: selection.startColumn + 2,
			};
			editor.setPosition(newPosition);
		}
		editor.focus();
	}
};

export const handleCodeClick = (editorRef: React.RefObject<MonacoEditorHandle | null>) => {
	const editor = editorRef.current?.getEditor();
	if (!editor) {
		return;
	}
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (selection && model) {
		const selectedText = model.getValueInRange(selection);
		const newText = selectedText.includes('\n') ? `\`\`\`\n${selectedText}\n\`\`\`` : selectedText ? `\`${selectedText}\`` : '``````';
		const cursorOffset = selectedText.includes('\n') ? 4 : selectedText ? 1 : 3;
		const op = {
			range: selection,
			text: newText,
			forceMoveMarkers: true,
		};
		editor.executeEdits('my-source', [op]);
		if (!selectedText) {
			const newPosition = {
				lineNumber: selection.startLineNumber,
				column: selection.startColumn + cursorOffset,
			};
			editor.setPosition(newPosition);
		}
		editor.focus();
	}
};

export const handleLinkClick = (editorRef: React.RefObject<MonacoEditorHandle | null>) => {
	const editor = editorRef.current?.getEditor();
	if (!editor) {
		return;
	}
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (selection && model) {
		const selectedText = model.getValueInRange(selection);
		const newText = `[${selectedText}](url)`;

		const op = {
			range: selection,
			text: newText,
			forceMoveMarkers: true,
		};
		editor.executeEdits('my-source', [op]);
		if (!selectedText) {
			const newPosition = {
				lineNumber: selection.startLineNumber,
				column: selection.startColumn + newText.indexOf('url') + 1,
			};
			editor.setPosition(newPosition);
		}
		editor.focus();
	}
};

export const handleUnOrderedListClick = (editorRef: React.RefObject<MonacoEditorHandle | null>) => {
	const editor = editorRef.current?.getEditor();
	if (!editor) {
		return;
	}
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (selection && model) {
		const selectedText = model.getValueInRange(selection);
		const newText = `- ${selectedText}`;

		const op = {
			range: selection,
			text: newText,
			forceMoveMarkers: true,
		};
		editor.executeEdits('my-source', [op]);
		if (!selectedText) {
			const newPosition = {
				lineNumber: selection.startLineNumber,
				column: selection.startColumn + 3,
			};
			editor.setPosition(newPosition);
		}
		editor.focus();
	}
};

export const handleNumberedListClick = (editorRef: React.RefObject<MonacoEditorHandle | null>) => {
	const editor = editorRef.current?.getEditor();
	if (!editor) {
		return;
	}
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (selection && model) {
		const selectedText = model.getValueInRange(selection);
		const newText = `1. ${selectedText}`;

		const op = {
			range: selection,
			text: newText,
			forceMoveMarkers: true,
		};
		editor.executeEdits('my-source', [op]);
		if (!selectedText) {
			const newPosition = {
				lineNumber: selection.startLineNumber,
				column: selection.startColumn + 3,
			};
			editor.setPosition(newPosition);
		}
		editor.focus();
	}
};

export const handleTaskListClick = (editorRef: React.RefObject<MonacoEditorHandle | null>) => {
	const editor = editorRef.current?.getEditor();
	if (!editor) {
		return;
	}
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (selection && model) {
		const selectedText = model.getValueInRange(selection);
		const newText = `- [ ] ${selectedText}`;

		const op = {
			range: selection,
			text: newText,
			forceMoveMarkers: true,
		};
		editor.executeEdits('my-source', [op]);
		if (!selectedText) {
			const newPosition = {
				lineNumber: selection.startLineNumber,
				column: selection.startColumn + 6,
			};
			editor.setPosition(newPosition);
		}
		editor.focus();
	}
};
