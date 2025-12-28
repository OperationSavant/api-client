import { RESPONSE_CONTENT_TYPE_OPTIONS } from '@/shared/constants/select-options';
import { CircleCheck, Copy, Download, Filter, Play, Search, Send, WrapText } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { EmptyState } from '../custom/states/empty-state';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/main-store';
import { useAppDispatch } from '@/store/main-store';
import { cn } from '@/shared/lib/utils';
import { setActiveResponseBodyTab } from '@/features/editor/editorUISlice';
import { ApiClientSelect } from '../custom/api-client-select';
import ApiClientButton from '../custom/api-client-button';
import { Separator } from '../ui/separator';
import ResponseImageViewer from './response-image-viewer';
import ResponsePDFViewer from './response-pdf-viewer';
import ResponseStringViewer from './response-string-viewer';
import { ApiClientInput } from '../custom/api-client-input';
import type { MonacoEditorHandle } from '@/shared/types/monaco';

interface ResponseBodyTabProps {
	responseBody: string;
	contentType: string;
	handleCopy: () => void;
}

const responseBodySelector = (responseBody: string, contentType: string) => {
	if (contentType.includes('image')) {
		return <ResponseImageViewer dataUri={responseBody} altText={'response-image'} />;
	} else if (contentType.includes('pdf')) {
		return <ResponsePDFViewer pdfData={responseBody} />;
	}
};

const renderBody = (
	activeResponseBodyTab: string,
	responseBody: string,
	contentType: string,
	language: string,
	wordWrap: boolean,
	editorRef: React.RefObject<MonacoEditorHandle | null>
) => {
	if (activeResponseBodyTab === 'preview') {
		return responseBodySelector(responseBody, contentType);
	}
	return <ResponseStringViewer value={responseBody} language={language} wordWrap={wordWrap} formatOnMount={true} ref={editorRef} />;
};

const ResponseBodyTab: React.FC<ResponseBodyTabProps> = ({ responseBody, contentType }) => {
	const dispatch = useAppDispatch();
	const {
		ui: { isExecuting, activeResponseBodyTab },
	} = useSelector((state: RootState) => state);
	const editorRef = useRef<MonacoEditorHandle>(null);
	const [wordWrap, setWordWrap] = useState(false);
	const [showFilter, setShowFilter] = useState(false);
	const [copied, setCopied] = useState(false);

	const getOptionsBasedOnresponseType = (contentType: string) => {
		if (contentType.includes('image') || contentType.includes('pdf')) {
			return RESPONSE_CONTENT_TYPE_OPTIONS.filter(option => option.responseType === 'binary');
		}
		return RESPONSE_CONTENT_TYPE_OPTIONS;
	};

	const setVisualBasedOnContentType = (contentType: string): string => {
		if (contentType.includes('image') || contentType.includes('pdf')) {
			return 'preview';
		}
		return 'default';
	};

	const getDefaultLanguageForContentType = (contentType: string): string => {
		if (contentType.includes('json')) {
			return 'json';
		} else if (contentType.includes('html')) {
			return 'html';
		} else if (contentType.includes('xml')) {
			return 'xml';
		} else if (contentType.includes('javascript')) {
			return 'javascript';
		} else if (contentType.includes('css')) {
			return 'css';
		}
		return 'hex';
	};

	const [language, setLanguage] = useState(() => getDefaultLanguageForContentType(contentType));
	const [options, setOptions] = useState(() => getOptionsBasedOnresponseType(contentType));

	const handleValueChange = (value: string) => {
		setLanguage(value);
		dispatch(setActiveResponseBodyTab('default'));
	};

	const handleSearch = async () => {
		await editorRef.current?.openSearch();
	};

	const handleCopy = async () => {
		setCopied(true);
		await editorRef.current?.copyToClipboard();
		setTimeout(() => {
			setCopied(false);
		}, 1000);
	};

	useEffect(() => {
		setOptions(getOptionsBasedOnresponseType(contentType));
		const tab = setVisualBasedOnContentType(contentType);
		dispatch(setActiveResponseBodyTab(tab));
		const defaultLanguage = getDefaultLanguageForContentType(contentType);
		setLanguage(defaultLanguage);
	}, [contentType, dispatch]);

	if (!responseBody) {
		return (
			<div className='relative'>
				<EmptyState
					icon={Send}
					title='No response yet'
					description='Send a request to see the response here'
					className={cn(isExecuting ? 'opacity-50' : 'opacity-100')}
				/>
			</div>
		);
	}

	const currentOption = options.find(option => option.value === language);
	return (
		<div className='relative h-full w-full rounded-none flex flex-col gap-2'>
			{/* HEADER DIV */}
			<div className='flex justify-between items-center w-full'>
				{/* TABS */}
				<div className='flex flex-1 gap-2 h-9'>
					{activeResponseBodyTab !== 'default' ? (
						<ApiClientButton variant='outline' content={language.toUpperCase()} className='w-fit' onClick={() => dispatch(setActiveResponseBodyTab('default'))}>
							{currentOption?.Icon && <currentOption.Icon />}
						</ApiClientButton>
					) : (
						<ApiClientSelect
							classNameTrigger={cn(`w-fit`, `${activeResponseBodyTab === 'default' ? 'border border-primary' : ''}`)}
							classNameContent={`w-fit justify-start`}
							classNameDiv='flex justify-center items-center uppercase'
							options={options.map(option => ({ label: option.label, value: option.value, Icon: option.Icon }))}
							value={language}
							onValueChange={value => handleValueChange(value)}
						/>
					)}
					<Separator orientation='vertical' className='w-1 bg-primary' />
					<ApiClientButton
						variant={`${activeResponseBodyTab === 'preview' ? 'default' : 'outline'}`}
						content='Preview'
						onClick={() => dispatch(setActiveResponseBodyTab('preview'))}>
						<Play />
					</ApiClientButton>
				</div>
				{/* OPTIONS */}
				<div className='flex justify-between items-center gap-2 h-9'>
					<ApiClientButton variant={wordWrap ? 'default' : 'outline'} size='icon' data-testid='wrap-button' onClick={() => setWordWrap(!wordWrap)}>
						<WrapText />
					</ApiClientButton>
					<Separator orientation='vertical' className='w-1 bg-primary' />
					<ApiClientButton variant={showFilter ? 'default' : 'outline'} size='icon' data-testid='filter-button' onClick={() => setShowFilter(!showFilter)}>
						<Filter />
					</ApiClientButton>
					<ApiClientButton variant={'outline'} size='icon' data-testid='search-button' onClick={handleSearch}>
						<Search />
					</ApiClientButton>
					<Separator orientation='vertical' className='w-1 bg-primary' />
					<ApiClientButton variant='outline' size='icon' data-testid='copy-button' onClick={handleCopy}>
						{copied ? <CircleCheck className='bg-primary' /> : <Copy />}
					</ApiClientButton>
					<ApiClientButton variant='outline' size='icon' data-testid='download-button'>
						<Download />
					</ApiClientButton>
				</div>
			</div>
			{/* Filter */}
			{showFilter && activeResponseBodyTab === 'default' && (
				<div className='flex w-full h-9'>
					<ApiClientInput className='w-full' />
				</div>
			)}
			{renderBody(activeResponseBodyTab, responseBody, contentType, language, wordWrap, editorRef)}
		</div>
	);
};

export default ResponseBodyTab;
