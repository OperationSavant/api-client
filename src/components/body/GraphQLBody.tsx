import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Play, FileText, Settings } from 'lucide-react';
import { GraphQLBodyConfig } from '@/types/body';

interface GraphQLBodyProps {
	graphqlConfig: GraphQLBodyConfig;
	onChange: (config: GraphQLBodyConfig) => void;
}

const GraphQLBody: React.FC<GraphQLBodyProps> = ({ graphqlConfig, onChange }) => {
	const [activeTab, setActiveTab] = useState('query');

	const updateQuery = (query: string) => {
		onChange({ ...graphqlConfig, query });
	};

	const updateVariables = (variables: string) => {
		onChange({ ...graphqlConfig, variables });
	};

	const updateOperationName = (operationName: string) => {
		onChange({ ...graphqlConfig, operationName });
	};

	const formatQuery = () => {
		try {
			// Basic GraphQL query formatting (indentation)
			let formatted = graphqlConfig.query;

			// Add indentation for nested structures
			formatted = formatted
				.replace(/{\s*/g, ' {\n  ')
				.replace(/}\s*/g, '\n}\n')
				.replace(/,\s*/g, ',\n  ')
				.replace(/\n\s*\n/g, '\n')
				.trim();

			updateQuery(formatted);
		} catch (error) {
			console.error('Failed to format GraphQL query:', error);
		}
	};

	const formatVariables = () => {
		try {
			if (graphqlConfig.variables.trim()) {
				const parsed = JSON.parse(graphqlConfig.variables);
				const formatted = JSON.stringify(parsed, null, 2);
				updateVariables(formatted);
			}
		} catch (error) {
			console.error('Failed to format variables:', error);
			// Don't update if parsing fails
		}
	};

	const validateVariables = () => {
		if (!graphqlConfig.variables.trim()) return { valid: true, message: 'No variables' };

		try {
			JSON.parse(graphqlConfig.variables);
			return { valid: true, message: 'Valid JSON' };
		} catch (error) {
			return {
				valid: false,
				message: `Invalid JSON: ${error instanceof Error ? error.message : 'Syntax error'}`,
			};
		}
	};

	const insertExampleQuery = () => {
		const example = `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts {
      id
      title
      content
      createdAt
    }
  }
}`;
		updateQuery(example);

		const exampleVariables = `{
  "id": "1"
}`;
		updateVariables(exampleVariables);
	};

	const insertExampleMutation = () => {
		const example = `mutation CreatePost($input: PostInput!) {
  createPost(input: $input) {
    id
    title
    content
    author {
      id
      name
    }
    createdAt
  }
}`;
		updateQuery(example);

		const exampleVariables = `{
  "input": {
    "title": "My New Post",
    "content": "This is the content of my post."
  }
}`;
		updateVariables(exampleVariables);
	};

	const variablesValidation = validateVariables();

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<Label className='text-sm font-medium'>GraphQL</Label>
				<div className='flex gap-2'>
					<Button onClick={insertExampleQuery} size='sm' variant='outline' className='flex items-center gap-2'>
						<FileText className='w-4 h-4' />
						Query Example
					</Button>
					<Button onClick={insertExampleMutation} size='sm' variant='outline' className='flex items-center gap-2'>
						<Play className='w-4 h-4' />
						Mutation Example
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='query'>Query</TabsTrigger>
					<TabsTrigger value='variables'>Variables</TabsTrigger>
					<TabsTrigger value='settings'>Settings</TabsTrigger>
				</TabsList>

				<TabsContent value='query' className='space-y-4'>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<Label htmlFor='graphql-query' className='text-sm'>
								GraphQL Query/Mutation
							</Label>
							<Button onClick={formatQuery} size='sm' variant='outline' className='flex items-center gap-2' disabled={!graphqlConfig.query.trim()}>
								<Code className='w-4 h-4' />
								Format
							</Button>
						</div>

						<Textarea
							id='graphql-query'
							value={graphqlConfig.query}
							onChange={e => updateQuery(e.target.value)}
							placeholder={`Enter your GraphQL query or mutation...

Example:
query GetUsers {
  users {
    id
    name
    email
  }
}`}
							className='font-mono text-sm min-h-[300px] resize-y'
							style={{
								fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
							}}
						/>
					</div>
				</TabsContent>

				<TabsContent value='variables' className='space-y-4'>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<Label htmlFor='graphql-variables' className='text-sm'>
								Variables (JSON)
							</Label>
							<div className='flex items-center gap-2'>
								<div
									className={`text-sm px-2 py-1 rounded ${
										variablesValidation.valid
											? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30'
											: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
									}`}>
									{variablesValidation.message}
								</div>
								<Button
									onClick={formatVariables}
									size='sm'
									variant='outline'
									className='flex items-center gap-2'
									disabled={!graphqlConfig.variables.trim() || !variablesValidation.valid}>
									<Code className='w-4 h-4' />
									Format
								</Button>
							</div>
						</div>

						<Textarea
							id='graphql-variables'
							value={graphqlConfig.variables}
							onChange={e => updateVariables(e.target.value)}
							placeholder={`Enter variables as JSON...

Example:
{
  "id": "123",
  "name": "John Doe"
}`}
							className='font-mono text-sm min-h-[200px] resize-y'
							style={{
								fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
							}}
						/>
					</div>
				</TabsContent>

				<TabsContent value='settings' className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='operation-name' className='text-sm'>
							Operation Name (Optional)
						</Label>
						<Input
							id='operation-name'
							value={graphqlConfig.operationName || ''}
							onChange={e => updateOperationName(e.target.value)}
							placeholder='e.g., GetUser, CreatePost'
						/>
						<p className='text-xs text-muted-foreground'>Specify which operation to execute when the query contains multiple operations</p>
					</div>
				</TabsContent>
			</Tabs>

			<div className='text-xs text-muted-foreground space-y-1'>
				<p>• Content-Type: application/json</p>
				<p>• GraphQL requests are sent as POST with JSON body</p>
				<p>• Variables must be valid JSON format</p>
				<p>• Use introspection queries to explore the schema</p>
			</div>
		</div>
	);
};

export default GraphQLBody;
