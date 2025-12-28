import { editor as monacoEditor, languages } from 'monaco-editor';
import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { format } from 'prettier/standalone';
import type { MonacoEditorHandle, MonacoEditorProps } from '@/shared/types/monaco';

export const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
	(
		{
			value,
			language,
			readOnly = false,
			height = '400px',
			wordWrap = false,
			minimap = false,
			formatOnMount = false,
			lineNumbers = true,
			onContentChange,
			className,
		},
		ref
	) => {
		const containerRef = useRef<HTMLDivElement>(null);
		const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
		const onChangeRef = useRef(onContentChange);

		/* -----------------------------
		 * Keep onChange stable
		 * ----------------------------- */
		useEffect(() => {
			onChangeRef.current = onContentChange;
		}, [onContentChange]);

		/* -----------------------------
		 * Register formatters (ONCE)
		 * ----------------------------- */
		useEffect(() => {
			const graphqlProvider = languages.registerDocumentFormattingEditProvider('graphql', {
				async provideDocumentFormattingEdits(model) {
					const { default: graphqlPlugin } = await import('prettier/plugins/graphql');
					const formatted = await format(model.getValue(), {
						parser: 'graphql',
						plugins: [graphqlPlugin],
					});

					return [
						{
							range: model.getFullModelRange(),
							text: formatted,
						},
					];
				},
			});

			const xmlProvider = languages.registerDocumentFormattingEditProvider('xml', {
				async provideDocumentFormattingEdits(model) {
					const { default: xmlPlugin } = await import('@prettier/plugin-xml');
					const formatted = await format(model.getValue(), {
						parser: 'xml',
						plugins: [xmlPlugin],
						printWidth: 120,
						tabWidth: 2,
						useTabs: false,

						xmlWhitespaceSensitivity: 'ignore',
						proseWrap: 'preserve',
					});

					return [
						{
							range: model.getFullModelRange(),
							text: formatted,
						},
					];
				},
			});

			return () => {
				graphqlProvider.dispose();
				xmlProvider.dispose();
			};
		}, []);

		/* -----------------------------
		 * Create editor ONCE
		 * ----------------------------- */
		useEffect(() => {
			if (!containerRef.current) return;

			const model = monacoEditor.createModel(value ?? '', language);

			const editor = monacoEditor.create(containerRef.current, {
				model,
				automaticLayout: true,
				scrollBeyondLastLine: false,
				renderLineHighlight: 'none',
			});

			editor.onDidChangeModelContent(() => {
				onChangeRef.current?.(editor.getValue());
			});

			if (formatOnMount && value) {
				queueMicrotask(async () => {
					await editor.getAction('editor.action.formatDocument')?.run();
				});
			}

			editorRef.current = editor;

			return () => {
				editor.dispose();
				model.dispose();
			};
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		/* -----------------------------
		 * Update model value
		 * ----------------------------- */
		useEffect(() => {
			const editor = editorRef.current;
			if (!editor) return;

			const model = editor.getModel();
			if (!model) return;

			if (model.getValue() !== value) {
				model.setValue(value ?? '');
			}
		}, [value]);

		/* -----------------------------
		 * Update language
		 * ----------------------------- */
		useEffect(() => {
			const model = editorRef.current?.getModel();
			if (model) {
				monacoEditor.setModelLanguage(model, language);
			}
		}, [language]);

		/* -----------------------------
		 * Update editor options (SAFE)
		 * ----------------------------- */
		useEffect(() => {
			const editor = editorRef.current;
			if (!editor) return;

			editor.updateOptions({
				readOnly,
				wordWrap: wordWrap ? 'on' : 'off',

				minimap: { enabled: minimap },
				lineNumbers: lineNumbers ? 'on' : 'off',

				glyphMargin: false,
				folding: true,
				showFoldingControls: 'mouseover',
				foldingStrategy: 'indentation',

				renderWhitespace: 'none',

				find: {
					cursorMoveOnType: true,
					seedSearchStringFromSelection: 'always',
					addExtraSpaceOnTop: false,
					autoFindInSelection: 'never',
					loop: true,
				},

				guides: {
					indentation: true,
					highlightActiveIndentation: 'always',
					bracketPairs: 'active',
					bracketPairsHorizontal: 'active',
				},

				scrollbar: {
					verticalScrollbarSize: 8,
					horizontalScrollbarSize: 8,
					useShadows: false,
				},

				overviewRulerLanes: 0,
				hideCursorInOverviewRuler: true,
				overviewRulerBorder: false,

				formatOnPaste: true,
				formatOnType: true,
			});
		}, [readOnly, wordWrap, minimap, lineNumbers]);

		/* -----------------------------
		 * Imperative API (COMMANDS)
		 * ----------------------------- */
		useImperativeHandle(ref, () => ({
			format: async () => {
				const editor = editorRef.current;
				await editor?.getAction('editor.action.formatDocument')?.run();
				return editor?.getValue();
			},
			openSearch: async () => {
				const editor = editorRef.current;
				await editor?.getAction('actions.find')?.run();
			},
			copyToClipboard: async () => {
				const editor = editorRef.current;
				const isEmptySelection = editor?.getSelection()?.isEmpty();
				if (isEmptySelection) {
					editor?.focus();
					editor?.trigger('keyboard', 'editor.action.selectAll', null);
				}
				await editor?.getAction('editor.action.clipboardCopyWithSyntaxHighlightingAction')?.run();
			},
			getEditor() {
				return editorRef.current;
			},
		}));

		return (
			<div ref={containerRef} className={className} style={{ height, width: '100%' }} data-testid='monaco-editor' aria-label={`Monaco editor (${language})`} />
		);
	}
);

MonacoEditor.displayName = 'MonacoEditor';
export default MonacoEditor;

