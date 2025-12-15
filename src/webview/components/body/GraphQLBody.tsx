import { Suspense, useRef, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RootState, useAppDispatch } from '@/store/main-store';
import { useSelector } from 'react-redux';
import { GraphQLBody } from '@/shared/types/body';
import { Label } from '@/components/ui/label';
import { Code, Database, Pencil, Settings2 } from 'lucide-react';
import ApiClientHeader from '@/components/custom/api-client-header';
import ApiClientButton from '@/components/custom/api-client-button';
import ApiClientFieldRow from '@/components/custom/api-client-field-row';
import { ApiClientInput } from '@/components/custom/api-client-input';
import { MonacoEditorHandle } from '@/shared/types/monaco';
import { setGraphQLBody, setGraphQLOperationName } from '@/features/request/requestSlice';
import { LoadingFallback } from '../custom/states/loading-fallback';
import { MonacoEditor } from '@/components/editor/lazy-monaco-editor';

const GraphQLBody: React.FC = () => {
	const [isQueryCollapsed, setIsQueryCollapsed] = useState(false);
	const [isVarsCollapsed, setIsVarsCollapsed] = useState(false);

	const dispatch = useAppDispatch();
	const bodyConfig = useSelector((state: RootState) => state.request.body);

	if (bodyConfig.type !== 'graphql' || !bodyConfig.graphql) {
		return null;
	}

	const graphqlConfig = bodyConfig.graphql;

	const queryEditorRef = useRef<MonacoEditorHandle>(null);
	const variablesEditorRef = useRef<MonacoEditorHandle>(null);

	const updateConfig = (newValues: Partial<GraphQLBody>) => {
		dispatch(setGraphQLBody({ ...graphqlConfig, ...newValues }));
	};

	const formatContent = async (editorRef: React.RefObject<MonacoEditorHandle | null>, field: 'query' | 'variables') => {
		try {
			if (editorRef.current) {
				const formatted = await editorRef.current.format();
				if (formatted) {
					updateConfig({ [field]: formatted });
				}
			}
		} catch (error) {
			console.error('Failed to format content:', error);
		}
	};

	const formatQuery = () => {
		formatContent(queryEditorRef, 'query');
	};

	const formatVariables = () => {
		formatContent(variablesEditorRef, 'variables');
	};

	const insertExampleQuery = () => {
		const query = `query GetUser($id: ID!) { user(id: $id) { id name email posts { id title content createdAt }}}`;
		const variables = `{ "id": "1" }`;
		dispatch(
			setGraphQLBody({
				...graphqlConfig,
				query,
				variables,
			})
		);
	};

	const insertExampleMutation = () => {
		const mutation = `mutation CreatePost($input: PostInput!) { createPost(input: $input) { id title content author { id name } createdAt }}`;
		const variables = `{ "input": { "title": "My New Post", "content": "This is the content of my post." }}`;
		dispatch(
			setGraphQLBody({
				...graphqlConfig,
				query: mutation,
				variables,
			})
		);
	};

	const validateVariables = () => {
		if (!graphqlConfig.variables!.trim()) return { valid: true, message: 'No variables' };

		try {
			JSON.parse(graphqlConfig.variables!);
			return { valid: true, message: 'Valid JSON' };
		} catch (error) {
			return {
				valid: false,
				message: `Invalid JSON: ${error instanceof Error ? error.message : 'Syntax error'}`,
			};
		}
	};

	return (
		<div className='space-y-4 h-full flex flex-col'>
			<ApiClientHeader headerText='GraphQL Body'>
				<div className='flex gap-2 justify-end'>
					<ApiClientButton onClick={insertExampleQuery} size='sm' variant='outline' content='Query Example'>
						<Database className='w-4 h-4' />
					</ApiClientButton>
					<ApiClientButton onClick={insertExampleMutation} size='sm' variant='outline' content='Mutation Example'>
						<Pencil className='w-4 h-4' />
					</ApiClientButton>
				</div>
			</ApiClientHeader>
			<ResizablePanelGroup direction='horizontal' className='flex-1 min-h-0 rounded-md border border-input'>
				<ResizablePanel defaultSize={60} minSize={20} onResize={size => setIsQueryCollapsed(size <= 30)}>
					<div className='flex flex-col h-full p-4 space-y-2'>
						<div className='flex items-center justify-between shrink-0'>
							<Label htmlFor='graphql-query' className='text-sm'>
								GraphQL Query/Mutation
							</Label>
							<div className='flex items-center gap-2'>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<ApiClientButton onClick={formatQuery} size='sm' variant='outline' disabled={!graphqlConfig.query?.trim()}>
												<Code className='w-4 h-4' /> {!isQueryCollapsed && <span className='ml-2'>Format</span>}
											</ApiClientButton>
										</TooltipTrigger>
										<TooltipContent>
											<p>Format Query</p>
										</TooltipContent>
									</Tooltip>
									<Popover>
										<Tooltip>
											<TooltipTrigger asChild>
												<PopoverTrigger asChild>
													<ApiClientButton size='sm' variant='outline' disabled={!graphqlConfig.query?.trim()}>
														<Settings2 className='w-4 h-4' /> {!isQueryCollapsed && <span className='ml-2'>Settings</span>}
													</ApiClientButton>
												</PopoverTrigger>
											</TooltipTrigger>
											<TooltipContent>
												<p>Settings</p>
											</TooltipContent>
										</Tooltip>
										<PopoverContent className='w-md bg-background z-20'>
											<div className='grid gap-4'>
												<div className='space-y-2'>
													<h4 className='font-medium leading-none'>Settings</h4>
													<p className='text-sm text-muted-foreground'>Additional GraphQL settings.</p>
												</div>
												<div className='space-y-2'>
													<ApiClientFieldRow htmlFor='operation-name' label='Operation Name'>
														<ApiClientInput
															id='operation-name'
															value={graphqlConfig.operationName || ''}
															onChange={e => dispatch(setGraphQLOperationName(e.target.value))}
															placeholder='e.g., GetUser'
														/>
													</ApiClientFieldRow>
												</div>
											</div>
										</PopoverContent>
									</Popover>
								</TooltipProvider>
							</div>
						</div>
						<div className='w-full'>
							<Suspense fallback={<LoadingFallback message='Loading Request Body Editor' />}>
								<MonacoEditor
									ref={queryEditorRef}
									value={graphqlConfig.query || ''}
									language='graphql'
									onContentChange={value => updateConfig({ query: value })}
								/>
							</Suspense>
						</div>
					</div>
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={40} minSize={20} onResize={size => setIsVarsCollapsed(size <= 25)}>
					<div className='flex flex-col h-full p-4 space-y-2'>
						<div className='flex items-center justify-between shrink-0'>
							<Label htmlFor='graphql-variables' className='text-sm'>
								Variables (JSON)
							</Label>
							<div className='flex items-center gap-2'>
								<div className={`text-sm px-2 py-1 rounded ${validateVariables().valid ? 'bg-muted' : 'text-destructive bg-muted'}`}>
									{validateVariables().message}
								</div>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<ApiClientButton
												onClick={formatVariables}
												size='sm'
												variant='outline'
												disabled={!graphqlConfig.variables?.trim() || !validateVariables().valid}>
												<Code className='w-4 h-4' /> {!isVarsCollapsed && <span className='ml-2'>Format</span>}
											</ApiClientButton>
										</TooltipTrigger>
										<TooltipContent>
											<p>Format Variables</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						</div>
						<div className='w-full'>
							<Suspense fallback={<LoadingFallback message='Loading Request Body Editor' />}>
								<MonacoEditor
									ref={variablesEditorRef}
									value={graphqlConfig.variables || ''}
									language='json'
									onContentChange={value => updateConfig({ variables: value })}
								/>
							</Suspense>
						</div>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
};

export default GraphQLBody;
