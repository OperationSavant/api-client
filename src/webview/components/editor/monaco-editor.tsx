import { editor as monacoEditorInstance, languages } from 'monaco-editor/esm/vs/editor/editor.api';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
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
			lineNumbers = true,
			copyButtonVisible = true,
			formatOnMount = true,
			onContentChange,
			className,
		},
		ref
	) => {
		const editorRef = useRef<HTMLDivElement>(null);
		const editorInstanceRef = useRef<monacoEditorInstance.IStandaloneCodeEditor | null>(null);
		const onContentChangeRef = useRef(onContentChange);
		const [copyText, setCopyText] = useState('Copy');

		useEffect(() => {
			onContentChangeRef.current = onContentChange;
		}, [onContentChange]);

		useImperativeHandle(
			ref,
			() => ({
				async format() {
					const editor = editorInstanceRef.current;
					if (!editor) {
						return;
					}
					await editor.getAction('editor.action.formatDocument')?.run();
					return editor.getValue();
				},
				getEditor: () => editorInstanceRef.current,
			}),
			[]
		);

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

		useEffect(() => {
			if (editorRef.current) {
				const editor = monacoEditorInstance.create(editorRef.current, {
					value,
					language,
					readOnly,
					automaticLayout: true,
					minimap: { enabled: minimap },
					scrollBeyondLastLine: false,
					renderLineHighlight: 'none',
					lineNumbers: lineNumbers ? 'on' : 'off',
					glyphMargin: false,
					folding: true,
					showFoldingControls: 'mouseover',
					foldingStrategy: 'indentation',
					renderWhitespace: 'none',
					guides: {
						indentation: true,
						highlightActiveIndentation: 'always',
						bracketPairs: 'active',
						bracketPairsHorizontal: 'active',
					},
					wordWrap: wordWrap ? 'on' : 'off',
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
				editorInstanceRef.current = editor;
				editor.onDidChangeModelContent(() => {
					if (onContentChangeRef.current) {
						onContentChangeRef.current(editor.getValue());
					}
				});
				const handleResize = () => editor.layout();
				window.addEventListener('resize', handleResize);
				if (formatOnMount && value) {
					setTimeout(async () => {
						await editor.getAction('editor.action.formatDocument')?.run();
					}, 100);
				}
				return () => {
					window.removeEventListener('resize', handleResize);
					editor.dispose();
				};
			}
		}, [formatOnMount, language, lineNumbers, minimap, readOnly, value, wordWrap]);

		useEffect(() => {
			const editor = editorInstanceRef.current;
			if (editor) {
				const model = editor.getModel();
				if (model && model.getValue() !== value) {
					editor.setValue(value);
					if (formatOnMount && value) {
						setTimeout(async () => {
							await editor.getAction('editor.action.formatDocument')?.run();
						}, 100);
					}
				}
			}
		}, [value, formatOnMount]);
		useEffect(() => {
			const editor = editorInstanceRef.current;
			if (editor) {
				const model = editor.getModel();
				if (model) {
					monacoEditorInstance.setModelLanguage(model, language);
				}
			}
		}, [language]);

		useEffect(() => {
			const provider: languages.DocumentFormattingEditProvider = {
				async provideDocumentFormattingEdits(model) {
					const { default: prettierPluginGraphql } = await import('prettier/plugins/graphql');
					const text = model.getValue();
					try {
						const formatted = await format(text, {
							parser: 'graphql',
							plugins: [prettierPluginGraphql],
						});
						return [
							{
								range: model.getFullModelRange(),
								text: formatted,
							},
						];
					} catch (error) {
						console.error('Prettier formatting failed:', error);
						return [];
					}
				},
			};
			const graphqlFormattingProvider = languages.registerDocumentFormattingEditProvider('graphql', provider);

			const xmlProvider: languages.DocumentFormattingEditProvider = {
				async provideDocumentFormattingEdits(model) {
					const { default: prettierPluginXml } = await import('@prettier/plugin-xml');
					const text = model.getValue();
					try {
						const formatted = await format(text, {
							parser: 'xml',
							plugins: [prettierPluginXml],
						});
						return [
							{
								range: model.getFullModelRange(),
								text: formatted,
							},
						];
					} catch (error) {
						console.error('Prettier XML formatting failed:', error);
						return [];
					}
				},
			};
			const xmlFormattingProvider = languages.registerDocumentFormattingEditProvider('xml', xmlProvider);
			return () => {
				graphqlFormattingProvider.dispose();
				xmlFormattingProvider.dispose();
			};
		}, []);

		return (
			<div
				className={`monaco-editor-container ${className}`}
				style={{ position: 'relative', height }}
				data-testid='monaco-editor-container'
				aria-label={`Monaco code editor for ${language} content`}>
				{copyButtonVisible && (
					<button
						onClick={handleCopy}
						tabIndex={0}
						className='absolute top-2 right-2 z-10 px-3 py-1 bg-background border border-border rounded text-xs hover:bg-accent transition-colors'>
						{copyText}
					</button>
				)}
				<div ref={editorRef} className='monaco-editor-wrapper' style={{ width: '100%', height: '100%' }} />
			</div>
		);
	}
);

MonacoEditor.displayName = 'MonacoEditor';

export default MonacoEditor;

