import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useEffect, useRef, useState } from 'react';

export interface MonacoEditorProps {
	value: string;
	language: string;
	readOnly?: boolean;
	theme?: 'vs' | 'vs-dark' | 'hc-black';
	height?: string | number;
	wordWrap?: boolean;
	minimap?: boolean;
	lineNumbers?: boolean;
	copyButtonVisible?: boolean;
	formatOnMount?: boolean;
	onContentChange?: (value: string) => void;
	className?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
	value,
	language,
	readOnly = true,
	theme = 'vs-dark',
	height = '400px',
	wordWrap = false,
	minimap = false,
	lineNumbers = true,
	copyButtonVisible = true,
	formatOnMount = true,
	onContentChange,
	className = '',
}) => {
	const editorRef = useRef<HTMLDivElement>(null);
	const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const [copyText, setCopyText] = useState('Copy');

	const handleCopy = async () => {
		if (editorInstanceRef.current) {
			const content = editorInstanceRef.current.getValue();
			try {
				await navigator.clipboard.writeText(content);
				setCopyText('Copied!');
				setTimeout(() => setCopyText('Copy'), 2000);
			} catch (error) {
				console.error('Failed to copy content:', error);
			}
		}
	};

	const formatContent = (editor: monaco.editor.IStandaloneCodeEditor) => {
		if (formatOnMount && !readOnly) {
			editor.updateOptions({ readOnly: false });
			setTimeout(() => {
				editor
					.getAction('editor.action.formatDocument')
					?.run()
					.then(() => {
						editor.updateOptions({ readOnly });
					});
			}, 100);
		}
	};

	useEffect(() => {
		if (editorRef.current) {
			// Dispose existing editor
			if (editorInstanceRef.current) {
				editorInstanceRef.current.dispose();
			}

			// Create new editor instance
			const editor = monaco.editor.create(editorRef.current, {
				value,
				language,
				theme,
				readOnly,
				automaticLayout: true,
				minimap: { enabled: minimap },
				scrollBeyondLastLine: false,
				renderLineHighlight: 'none',
				lineNumbers: lineNumbers ? 'on' : 'off',
				glyphMargin: false,
				folding: true,
				wordWrap: wordWrap ? 'on' : 'off',
				scrollbar: {
					verticalScrollbarSize: 8,
					horizontalScrollbarSize: 8,
					useShadows: false,
				},
				overviewRulerLanes: 0,
				hideCursorInOverviewRuler: true,
				overviewRulerBorder: false,
				quickSuggestions: false,
				wordBasedSuggestions: 'off',
				suggestOnTriggerCharacters: false,
				acceptSuggestionOnEnter: 'off',
				tabCompletion: 'off',
				parameterHints: { enabled: false },
				contextmenu: true,
				mouseWheelZoom: true,
			});

			editorInstanceRef.current = editor;

			// Handle content changes
			if (onContentChange) {
				editor.onDidChangeModelContent(() => {
					onContentChange(editor.getValue());
				});
			}

			// Handle resize
			const handleResize = () => {
				editor.layout();
			};
			window.addEventListener('resize', handleResize);

			// Format content if needed
			if (formatOnMount && value) {
				formatContent(editor);
			}

			// Cleanup
			return () => {
				window.removeEventListener('resize', handleResize);
				editor.dispose();
			};
		}
	}, []);

	// Update editor when props change
	useEffect(() => {
		if (editorInstanceRef.current) {
			const editor = editorInstanceRef.current;
			const model = editor.getModel();

			if (model && model.getValue() !== value) {
				editor.setValue(value);
				if (formatOnMount) {
					formatContent(editor);
				}
			}
		}
	}, [value, formatOnMount]);

	useEffect(() => {
		if (editorInstanceRef.current) {
			const model = editorInstanceRef.current.getModel();
			if (model) {
				monaco.editor.setModelLanguage(model, language);
			}
		}
	}, [language]);

	useEffect(() => {
		if (editorInstanceRef.current) {
			editorInstanceRef.current.updateOptions({
				wordWrap: wordWrap ? 'on' : 'off',
			});
		}
	}, [wordWrap]);

	useEffect(() => {
		if (editorInstanceRef.current) {
			editorInstanceRef.current.updateOptions({
				minimap: { enabled: minimap },
			});
		}
	}, [minimap]);

	useEffect(() => {
		if (editorInstanceRef.current) {
			monaco.editor.setTheme(theme);
		}
	}, [theme]);

	return (
		<div
			className={`monaco-editor-container ${className}`}
			style={{ position: 'relative', height }}
			data-testid='monaco-editor-container'
			role='textbox'
			aria-label={`Monaco code editor for ${language} content`}>
			{copyButtonVisible && (
				<button
					onClick={handleCopy}
					tabIndex={0}
					className='absolute top-2 right-2 z-10 px-3 py-1 bg-background border border-border rounded text-xs hover:bg-accent transition-colors'
					style={{ zIndex: 1000 }}>
					{copyText}
				</button>
			)}
			<div ref={editorRef} className='monaco-editor-wrapper' style={{ width: '100%', height: '100%' }} />
		</div>
	);
};

export default MonacoEditor;
