import React, { useState } from 'react';
import ApiClientButton from '../custom/api-client-button';
import MonacoEditor from './monaco-editor';
import { cn } from '@/shared/lib/utils';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Bold, Code, Heading, Italic, Link, List, ListOrdered, ListTodo, TextQuote } from 'lucide-react';
import { Separator } from '../ui/separator';
import {
	handleBoldClick,
	handleCodeClick,
	handleHeadingClick,
	handleItalicClick,
	handleLinkClick,
	handleNumberedListClick,
	handleQuoteClick,
	handleTaskListClick,
	handleUnOrderedListClick,
} from '@/shared/lib/toolbar-helpers';
import { MonacoEditorHandle } from '@/shared/types/monaco';

interface MarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, className }) => {
	const editorRef = React.useRef<MonacoEditorHandle>(null);
	const [activeTab, setActiveTab] = useState<'markdown' | 'preview'>('markdown');

	return (
		<div className={cn('flex flex-col border border-input rounded-md h-40', className)}>
			<div className='flex border-b border-input'>
				<div className='flex shrink-0'>
					<ApiClientButton
						variant={activeTab === 'markdown' ? 'secondary' : 'ghost'}
						size='sm'
						onClick={() => setActiveTab('markdown')}
						className='rounded-none rounded-tl-md'>
						Rich Text Editor
					</ApiClientButton>
					<ApiClientButton variant={activeTab === 'preview' ? 'secondary' : 'ghost'} size='sm' onClick={() => setActiveTab('preview')} className='rounded-none'>
						Preview
					</ApiClientButton>
				</div>
				<div className='flex flex-1 justify-end-safe'>
					<ApiClientButton variant={'ghost'} size='sm' className='rounded-none' onClick={() => handleHeadingClick(editorRef)}>
						<Heading />
					</ApiClientButton>
					<ApiClientButton variant={'ghost'} size='sm' className='rounded-none' onClick={() => handleBoldClick(editorRef)}>
						<Bold />
					</ApiClientButton>
					<ApiClientButton variant={'ghost'} size='sm' className='rounded-none' onClick={() => handleItalicClick(editorRef)}>
						<Italic />
					</ApiClientButton>
					<Separator orientation='vertical' />
					<ApiClientButton variant={'ghost'} size='sm' className='rounded-none' onClick={() => handleQuoteClick(editorRef)}>
						<TextQuote />
					</ApiClientButton>
					<ApiClientButton variant={'ghost'} size='sm' className='rounded-none' onClick={() => handleCodeClick(editorRef)}>
						<Code />
					</ApiClientButton>
					<ApiClientButton variant={'ghost'} size='sm' className='rounded-none' onClick={() => handleLinkClick(editorRef)}>
						<Link />
					</ApiClientButton>
					<Separator orientation='vertical' />
					<ApiClientButton variant={'ghost'} size='sm' className='rounded-none' onClick={() => handleUnOrderedListClick(editorRef)}>
						<List />
					</ApiClientButton>
					<ApiClientButton variant={'ghost'} size='sm' className='rounded-none' onClick={() => handleNumberedListClick(editorRef)}>
						<ListOrdered />
					</ApiClientButton>
					<ApiClientButton variant={'ghost'} size='sm' className='rounded-none' onClick={() => handleTaskListClick(editorRef)}>
						<ListTodo />
					</ApiClientButton>
				</div>
			</div>
			<div className='flex flex-col flex-1 relative border border-input rounded-none overflow-y-auto pr-2 [scrollbar-gutter:stable] min-h-0'>
				{activeTab === 'markdown' && (
					<MonacoEditor ref={editorRef} value={value} onContentChange={onChange} language={'markdown'} height={'100%'} lineNumbers={false} />
				)}
				{activeTab === 'preview' && (
					<div className='flex flex-col prose dark:prose-invert bg-background! text-foreground! max-w-full!'>
						<Markdown rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSanitize]} remarkPlugins={[remarkGfm]}>
							{value}
						</Markdown>
					</div>
				)}
			</div>
		</div>
	);
};
